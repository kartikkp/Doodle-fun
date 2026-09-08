import XCTest
import CryptoKit
import UIKit
import WebKit
@testable import DoodleFun

final class NativeBridgeTests: XCTestCase {
    func testPackagedPageMatchesItsBuildManifestAndHasNoScriptDependencies() throws {
        let html = try Data(contentsOf: XCTUnwrap(Bundle.main.url(forResource: "index", withExtension: "html")))
        let manifest = try JSONSerialization.jsonObject(with: Data(contentsOf: XCTUnwrap(Bundle.main.url(forResource: "BundleManifest", withExtension: "json")))) as! [String: String]
        let digest = SHA256.hash(data: html).map { String(format: "%02x", $0) }.joined()
        XCTAssertEqual(digest, manifest["sha256"])
        let page = try XCTUnwrap(String(data: html, encoding: .utf8))
        XCTAssertTrue(page.contains("name=\"doodle-build\" content=\"\(try XCTUnwrap(manifest["fingerprint"]))\""))
        XCTAssertNil(page.range(of: "<script\\b[^>]*\\bsrc\\s*=", options: [.regularExpression, .caseInsensitive]))
    }

    func testDocumentNavigationIsExactAndLocal() {
        let document = URL(fileURLWithPath: "/bundle/index.html")
        XCTAssertTrue(NativeBridgePolicy.allows(URL(string: "file:///bundle/index.html#memory"), document: document))
        for value in ["https://example.com", "file:///bundle/private.txt", "file:///bundle/index.html.evil", "file://remote/bundle/index.html", "file:///bundle/index.html?remote=true", "data:text/html,test"] {
            XCTAssertFalse(NativeBridgePolicy.allows(URL(string: value), document: document), value)
        }
    }

    func testOnlyBoundedPNGCanBeSharedAndNameCannotEscapeDirectory() {
        let image = UIGraphicsImageRenderer(size: CGSize(width: 2, height: 2)).image { context in
            UIColor.purple.setFill()
            context.fill(CGRect(x: 0, y: 0, width: 2, height: 2))
        }
        let data = image.pngData()!
        let encoded = "data:image/png;base64," + data.base64EncodedString()
        let accepted = NativeBridgePolicy.shareImage(["dataURL": encoded, "name": "../../my:doodle.png"])
        XCTAssertNotNil(accepted)
        XCTAssertEqual(accepted?.filename, "mydoodle.png")
        XCTAssertNotNil(UIImage(data: accepted!.png))
        for value in ["data:image/jpeg;base64," + data.base64EncodedString(), "data:image/png;base64,!", "data:image/png;base64," + Data([137,80,78,71,13,10,26,10]).base64EncodedString(), "https://example.com/image.png"] {
            XCTAssertNil(NativeBridgePolicy.shareImage(["dataURL": value]))
        }
        XCTAssertNil(NativeBridgePolicy.shareImage(["dataURL": "data:image/png;base64," + String(repeating: "A", count: 14_000_000)]))
        XCTAssertNil(NativeBridgePolicy.shareImage(["dataURL": 12]))
        let wide = UIGraphicsImageRenderer(size: CGSize(width: 4097, height: 1)).image { _ in }.pngData()!
        XCTAssertNil(NativeBridgePolicy.shareImage(["dataURL": "data:image/png;base64," + wide.base64EncodedString()]))
    }

    func testRouteMessagesAreBounded() {
        XCTAssertEqual(NativeBridgePolicy.route("#word-build"), "#word-build")
        XCTAssertNil(NativeBridgePolicy.route("#<script>"))
        XCTAssertNil(NativeBridgePolicy.route("https://example.com"))
        XCTAssertNil(NativeBridgePolicy.route("#" + String(repeating: "a", count: 61)))
    }

    @MainActor
    func testWebProcessRecoveryKeepsActivityAndLocalProgress() async throws {
        let controller = DoodleViewController()
        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = controller
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        let initial = expectation(description: "Bundled page loaded")
        controller.onContentReady = { initial.fulfill() }
        controller.loadViewIfNeeded()
        await fulfillment(of: [initial], timeout: 30)
        try await controller.webView.evaluateJavaScript("localStorage.setItem('native-recovery-test','kept');location.hash='memory'")
        let route = expectation(description: "Route delivered")
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { route.fulfill() }
        await fulfillment(of: [route], timeout: 2)
        XCTAssertEqual(controller.currentHash, "#memory")
        let restored = expectation(description: "Recovery reload finished")
        controller.onContentReady = { restored.fulfill() }
        // Exercise the public delegate callback; no private process-kill APIs.
        controller.webViewWebContentProcessDidTerminate(controller.webView)
        await fulfillment(of: [restored], timeout: 30)
        let saved = try await controller.webView.evaluateJavaScript("localStorage.getItem('native-recovery-test')") as? String
        XCTAssertEqual(saved, "kept")
        XCTAssertEqual(controller.webView.url?.fragment, "memory")
        _ = try await controller.webView.evaluateJavaScript("localStorage.removeItem('native-recovery-test')")
    }
}
