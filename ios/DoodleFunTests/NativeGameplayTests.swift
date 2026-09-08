// TEST ONLY: appended to the copied test target by run-iphone-qa.mjs.
// No production project, bundled HTML or signing settings are changed.
// Each age has its own class for scheduling, and every activity has an explicit
// method/result. DOM/synthetic-pointer integration is distinct from XCUITest
// trusted simulator finger gestures, native sharing, orientation and lifecycle.
import XCTest
import UIKit
import WebKit
@testable import DoodleFun

@MainActor
class NativeGameplayCase: XCTestCase {
    private struct GameplayError: LocalizedError {
        let message: String
        var errorDescription: String? { message }
    }

    fileprivate func loadReady(_ controller: DoodleViewController, label: String, action: () -> Void) async throws {
        let ready = expectation(description: label)
        var loaded = false
        controller.onContentReady = { [weak controller] in
            loaded = true
            controller?.onContentReady = nil
            ready.fulfill()
        }
        action()
        await fulfillment(of: [ready], timeout: 25)
        guard loaded else { throw GameplayError(message: "Timed out waiting for \(label)") }
    }

    fileprivate func evaluate(_ script: String, in webView: WKWebView, label: String) async throws -> Any {
        let finished = expectation(description: label)
        var result: Result<Any, Error>?
        webView.evaluateJavaScript(script) { value, error in
            result = error.map { .failure($0) } ?? .success(value ?? NSNull())
            finished.fulfill()
        }
        await fulfillment(of: [finished], timeout: 15)
        guard let result else { throw GameplayError(message: "Timed out: \(label)") }
        return try result.get()
    }

    fileprivate func attachReport(_ report: [String: Any], name: String) {
        guard let data = try? JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys]) else { return }
        let attachment = XCTAttachment(data: data, uniformTypeIdentifier: "public.json")
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    fileprivate func nativeGeometry(_ controller: DoodleViewController, window: UIWindow) -> [String: Any] {
        window.layoutIfNeeded()
        controller.view.layoutIfNeeded()
        controller.webView.layoutIfNeeded()
        func insets(_ value: UIEdgeInsets) -> [String: Double] {
            ["top": Double(value.top), "left": Double(value.left), "bottom": Double(value.bottom), "right": Double(value.right)]
        }
        func bounds(_ value: CGRect) -> [String: Double] {
            ["x": Double(value.origin.x), "y": Double(value.origin.y), "width": Double(value.width), "height": Double(value.height)]
        }
        return [
            "unit": "UIKit points",
            "viewSafeAreaInsets": insets(controller.view.safeAreaInsets),
            "windowSafeAreaInsets": insets(window.safeAreaInsets),
            "viewBounds": bounds(controller.view.bounds),
            "windowBounds": bounds(window.bounds),
            "viewFrameInWindow": bounds(controller.view.convert(controller.view.bounds, to: window)),
            "webViewBounds": bounds(controller.webView.bounds),
            "webViewFrameInWindow": bounds(controller.webView.convert(controller.webView.bounds, to: window))
        ]
    }

    func exercise(_ id: String, age: Int) async throws {
        let caseName = "age \(age) / \(id)"
        let controller = DoodleViewController()
        let window: UIWindow
        if let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first {
            window = UIWindow(windowScene: scene)
            window.frame = scene.coordinateSpace.bounds
        } else {
            window = UIWindow(frame: UIScreen.main.bounds)
        }
        var geometry: [String: Any] = [:]
        defer {
            controller.onContentReady = nil
            controller.webView?.stopLoading()
            window.isHidden = true
            window.rootViewController = nil
        }
        do {
            try await loadReady(controller, label: "\(caseName): packaged app launch") {
                window.rootViewController = controller
                window.makeKeyAndVisible()
                controller.loadViewIfNeeded()
            }
            // The runner uses a dedicated simulator. Reset only this app's
            // prefixed test state, never browser/global website stores.
            let settings: [String: Any] = ["age": age, "level": "auto", "sound": false, "challengeOffset": 0]
            let settingsJSON = String(data: try JSONSerialization.data(withJSONObject: settings), encoding: .utf8)!
            _ = try await evaluate("""
                (() => {
                  for (const key of Object.keys(localStorage)) {
                    if (key.startsWith('doodle-fun:v2:')) localStorage.removeItem(key);
                  }
                  localStorage.setItem('doodle-fun:v2:settings', JSON.stringify(\(settingsJSON)));
                  return true;
                })()
                """, in: controller.webView, label: "\(caseName): isolated activity settings")
            try await loadReady(controller, label: "\(caseName): reload exact age") {
                controller.webView.reload()
            }
            geometry = nativeGeometry(controller, window: window)
            if let data = try? JSONSerialization.data(withJSONObject: geometry, options: [.sortedKeys]),
               let line = String(data: data, encoding: .utf8) {
                print("NATIVE_SAFE_AREA age=\(age) id=\(id) \(line)")
            }
            _ = try await evaluate(NativeQAFixtures.script, in: controller.webView, label: "\(caseName): test-only fixture load")
            let finished = expectation(description: "\(caseName): full gameplay")
            var outcome: Result<Any, Error>?
            controller.webView.callAsyncJavaScript(
                "return await globalThis.__doodleNativeQA({id, age});",
                arguments: ["id": id, "age": age], in: nil, in: .page
            ) { result in
                outcome = result
                finished.fulfill()
            }
            await fulfillment(of: [finished], timeout: 45)
            guard let outcome else { throw GameplayError(message: "\(caseName): gameplay timed out") }
            let value = try outcome.get()
            guard var report = value as? [String: Any] else { throw GameplayError(message: "\(caseName): invalid fixture report \(value)") }
            report["nativeGeometry"] = geometry
            attachReport(report, name: "Native gameplay age \(age) - \(id)")
            XCTAssertEqual(report["status"] as? String, "passed", "\(caseName): \(report["error"] ?? "No explanatory result")")
            XCTAssertEqual(report["id"] as? String, id, caseName)
            XCTAssertEqual(report["age"] as? Int, age, caseName)
            XCTAssertGreaterThan(report["assertions"] as? Int ?? 0, 10, "\(caseName): a launch-only check is insufficient")
            XCTAssertGreaterThanOrEqual((report["steps"] as? [String])?.count ?? 0, 4, "\(caseName): learning and recovery stages must execute")
        } catch {
            attachReport(["id": id, "age": age, "status": "failed", "nativeError": error.localizedDescription, "nativeGeometry": geometry], name: "Native gameplay failure age \(age) - \(id)")
            throw GameplayError(message: "\(caseName): \(error.localizedDescription)")
        }
    }
}

final class NativeGameplayAge02Tests: NativeGameplayCase {
    func testDraw() async throws { try await exercise("draw", age: 2) }
    func testColoring() async throws { try await exercise("coloring", age: 2) }
    func testPrewriting() async throws { try await exercise("prewriting", age: 2) }
    func testUppercase() async throws { try await exercise("uppercase", age: 2) }
    func testLowercase() async throws { try await exercise("lowercase", age: 2) }
    func testWordTracing() async throws { try await exercise("word-tracing", age: 2) }
    func testNumberTracing() async throws { try await exercise("number-tracing", age: 2) }
    func testCounting() async throws { try await exercise("counting", age: 2) }
    func testAddition() async throws { try await exercise("addition", age: 2) }
    func testEqualGroups() async throws { try await exercise("equal-groups", age: 2) }
    func testShapeMatch() async throws { try await exercise("shape-match", age: 2) }
    func testColorMatch() async throws { try await exercise("color-match", age: 2) }
    func testPatterns() async throws { try await exercise("patterns", age: 2) }
    func testSorting() async throws { try await exercise("sorting", age: 2) }
    func testOddOneOut() async throws { try await exercise("odd-one-out", age: 2) }
    func testMemory() async throws { try await exercise("memory", age: 2) }
    func testMaze() async throws { try await exercise("maze", age: 2) }
    func testCompare() async throws { try await exercise("compare", age: 2) }
    func testNumberOrder() async throws { try await exercise("number-order", age: 2) }
    func testSubtraction() async throws { try await exercise("subtraction", age: 2) }
    func testNumberBonds() async throws { try await exercise("number-bonds", age: 2) }
    func testTenFrame() async throws { try await exercise("ten-frame", age: 2) }
    func testLetterMatch() async throws { try await exercise("letter-match", age: 2) }
    func testWordBuild() async throws { try await exercise("word-build", age: 2) }
    func testSizeOrder() async throws { try await exercise("size-order", age: 2) }
    func testPictureSequence() async throws { try await exercise("picture-sequence", age: 2) }
    func testDirections() async throws { try await exercise("directions", age: 2) }
    func testMakeAShape() async throws { try await exercise("make-a-shape", age: 2) }
    func testRhythm() async throws { try await exercise("rhythm", age: 2) }
    func testSharing() async throws { try await exercise("sharing", age: 2) }
}

final class NativeGameplayAge03Tests: NativeGameplayCase {
    func testDraw() async throws { try await exercise("draw", age: 3) }
    func testColoring() async throws { try await exercise("coloring", age: 3) }
    func testPrewriting() async throws { try await exercise("prewriting", age: 3) }
    func testUppercase() async throws { try await exercise("uppercase", age: 3) }
    func testLowercase() async throws { try await exercise("lowercase", age: 3) }
    func testWordTracing() async throws { try await exercise("word-tracing", age: 3) }
    func testNumberTracing() async throws { try await exercise("number-tracing", age: 3) }
    func testCounting() async throws { try await exercise("counting", age: 3) }
    func testAddition() async throws { try await exercise("addition", age: 3) }
    func testEqualGroups() async throws { try await exercise("equal-groups", age: 3) }
    func testShapeMatch() async throws { try await exercise("shape-match", age: 3) }
    func testColorMatch() async throws { try await exercise("color-match", age: 3) }
    func testPatterns() async throws { try await exercise("patterns", age: 3) }
    func testSorting() async throws { try await exercise("sorting", age: 3) }
    func testOddOneOut() async throws { try await exercise("odd-one-out", age: 3) }
    func testMemory() async throws { try await exercise("memory", age: 3) }
    func testMaze() async throws { try await exercise("maze", age: 3) }
    func testCompare() async throws { try await exercise("compare", age: 3) }
    func testNumberOrder() async throws { try await exercise("number-order", age: 3) }
    func testSubtraction() async throws { try await exercise("subtraction", age: 3) }
    func testNumberBonds() async throws { try await exercise("number-bonds", age: 3) }
    func testTenFrame() async throws { try await exercise("ten-frame", age: 3) }
    func testLetterMatch() async throws { try await exercise("letter-match", age: 3) }
    func testWordBuild() async throws { try await exercise("word-build", age: 3) }
    func testSizeOrder() async throws { try await exercise("size-order", age: 3) }
    func testPictureSequence() async throws { try await exercise("picture-sequence", age: 3) }
    func testDirections() async throws { try await exercise("directions", age: 3) }
    func testMakeAShape() async throws { try await exercise("make-a-shape", age: 3) }
    func testRhythm() async throws { try await exercise("rhythm", age: 3) }
    func testSharing() async throws { try await exercise("sharing", age: 3) }
}

final class NativeGameplayAge04Tests: NativeGameplayCase {
    func testDraw() async throws { try await exercise("draw", age: 4) }
    func testColoring() async throws { try await exercise("coloring", age: 4) }
    func testPrewriting() async throws { try await exercise("prewriting", age: 4) }
    func testUppercase() async throws { try await exercise("uppercase", age: 4) }
    func testLowercase() async throws { try await exercise("lowercase", age: 4) }
    func testWordTracing() async throws { try await exercise("word-tracing", age: 4) }
    func testNumberTracing() async throws { try await exercise("number-tracing", age: 4) }
    func testCounting() async throws { try await exercise("counting", age: 4) }
    func testAddition() async throws { try await exercise("addition", age: 4) }
    func testEqualGroups() async throws { try await exercise("equal-groups", age: 4) }
    func testShapeMatch() async throws { try await exercise("shape-match", age: 4) }
    func testColorMatch() async throws { try await exercise("color-match", age: 4) }
    func testPatterns() async throws { try await exercise("patterns", age: 4) }
    func testSorting() async throws { try await exercise("sorting", age: 4) }
    func testOddOneOut() async throws { try await exercise("odd-one-out", age: 4) }
    func testMemory() async throws { try await exercise("memory", age: 4) }
    func testMaze() async throws { try await exercise("maze", age: 4) }
    func testCompare() async throws { try await exercise("compare", age: 4) }
    func testNumberOrder() async throws { try await exercise("number-order", age: 4) }
    func testSubtraction() async throws { try await exercise("subtraction", age: 4) }
    func testNumberBonds() async throws { try await exercise("number-bonds", age: 4) }
    func testTenFrame() async throws { try await exercise("ten-frame", age: 4) }
    func testLetterMatch() async throws { try await exercise("letter-match", age: 4) }
    func testWordBuild() async throws { try await exercise("word-build", age: 4) }
    func testSizeOrder() async throws { try await exercise("size-order", age: 4) }
    func testPictureSequence() async throws { try await exercise("picture-sequence", age: 4) }
    func testDirections() async throws { try await exercise("directions", age: 4) }
    func testMakeAShape() async throws { try await exercise("make-a-shape", age: 4) }
    func testRhythm() async throws { try await exercise("rhythm", age: 4) }
    func testSharing() async throws { try await exercise("sharing", age: 4) }
}

final class NativeGameplayAge05Tests: NativeGameplayCase {
    func testDraw() async throws { try await exercise("draw", age: 5) }
    func testColoring() async throws { try await exercise("coloring", age: 5) }
    func testPrewriting() async throws { try await exercise("prewriting", age: 5) }
    func testUppercase() async throws { try await exercise("uppercase", age: 5) }
    func testLowercase() async throws { try await exercise("lowercase", age: 5) }
    func testWordTracing() async throws { try await exercise("word-tracing", age: 5) }
    func testNumberTracing() async throws { try await exercise("number-tracing", age: 5) }
    func testCounting() async throws { try await exercise("counting", age: 5) }
    func testAddition() async throws { try await exercise("addition", age: 5) }
    func testEqualGroups() async throws { try await exercise("equal-groups", age: 5) }
    func testShapeMatch() async throws { try await exercise("shape-match", age: 5) }
    func testColorMatch() async throws { try await exercise("color-match", age: 5) }
    func testPatterns() async throws { try await exercise("patterns", age: 5) }
    func testSorting() async throws { try await exercise("sorting", age: 5) }
    func testOddOneOut() async throws { try await exercise("odd-one-out", age: 5) }
    func testMemory() async throws { try await exercise("memory", age: 5) }
    func testMaze() async throws { try await exercise("maze", age: 5) }
    func testCompare() async throws { try await exercise("compare", age: 5) }
    func testNumberOrder() async throws { try await exercise("number-order", age: 5) }
    func testSubtraction() async throws { try await exercise("subtraction", age: 5) }
    func testNumberBonds() async throws { try await exercise("number-bonds", age: 5) }
    func testTenFrame() async throws { try await exercise("ten-frame", age: 5) }
    func testLetterMatch() async throws { try await exercise("letter-match", age: 5) }
    func testWordBuild() async throws { try await exercise("word-build", age: 5) }
    func testSizeOrder() async throws { try await exercise("size-order", age: 5) }
    func testPictureSequence() async throws { try await exercise("picture-sequence", age: 5) }
    func testDirections() async throws { try await exercise("directions", age: 5) }
    func testMakeAShape() async throws { try await exercise("make-a-shape", age: 5) }
    func testRhythm() async throws { try await exercise("rhythm", age: 5) }
    func testSharing() async throws { try await exercise("sharing", age: 5) }
}

final class NativeGameplayAge06Tests: NativeGameplayCase {
    func testDraw() async throws { try await exercise("draw", age: 6) }
    func testColoring() async throws { try await exercise("coloring", age: 6) }
    func testPrewriting() async throws { try await exercise("prewriting", age: 6) }
    func testUppercase() async throws { try await exercise("uppercase", age: 6) }
    func testLowercase() async throws { try await exercise("lowercase", age: 6) }
    func testWordTracing() async throws { try await exercise("word-tracing", age: 6) }
    func testNumberTracing() async throws { try await exercise("number-tracing", age: 6) }
    func testCounting() async throws { try await exercise("counting", age: 6) }
    func testAddition() async throws { try await exercise("addition", age: 6) }
    func testEqualGroups() async throws { try await exercise("equal-groups", age: 6) }
    func testShapeMatch() async throws { try await exercise("shape-match", age: 6) }
    func testColorMatch() async throws { try await exercise("color-match", age: 6) }
    func testPatterns() async throws { try await exercise("patterns", age: 6) }
    func testSorting() async throws { try await exercise("sorting", age: 6) }
    func testOddOneOut() async throws { try await exercise("odd-one-out", age: 6) }
    func testMemory() async throws { try await exercise("memory", age: 6) }
    func testMaze() async throws { try await exercise("maze", age: 6) }
    func testCompare() async throws { try await exercise("compare", age: 6) }
    func testNumberOrder() async throws { try await exercise("number-order", age: 6) }
    func testSubtraction() async throws { try await exercise("subtraction", age: 6) }
    func testNumberBonds() async throws { try await exercise("number-bonds", age: 6) }
    func testTenFrame() async throws { try await exercise("ten-frame", age: 6) }
    func testLetterMatch() async throws { try await exercise("letter-match", age: 6) }
    func testWordBuild() async throws { try await exercise("word-build", age: 6) }
    func testSizeOrder() async throws { try await exercise("size-order", age: 6) }
    func testPictureSequence() async throws { try await exercise("picture-sequence", age: 6) }
    func testDirections() async throws { try await exercise("directions", age: 6) }
    func testMakeAShape() async throws { try await exercise("make-a-shape", age: 6) }
    func testRhythm() async throws { try await exercise("rhythm", age: 6) }
    func testSharing() async throws { try await exercise("sharing", age: 6) }
}

final class NativeGameplayAge07Tests: NativeGameplayCase {
    func testDraw() async throws { try await exercise("draw", age: 7) }
    func testColoring() async throws { try await exercise("coloring", age: 7) }
    func testPrewriting() async throws { try await exercise("prewriting", age: 7) }
    func testUppercase() async throws { try await exercise("uppercase", age: 7) }
    func testLowercase() async throws { try await exercise("lowercase", age: 7) }
    func testWordTracing() async throws { try await exercise("word-tracing", age: 7) }
    func testNumberTracing() async throws { try await exercise("number-tracing", age: 7) }
    func testCounting() async throws { try await exercise("counting", age: 7) }
    func testAddition() async throws { try await exercise("addition", age: 7) }
    func testEqualGroups() async throws { try await exercise("equal-groups", age: 7) }
    func testShapeMatch() async throws { try await exercise("shape-match", age: 7) }
    func testColorMatch() async throws { try await exercise("color-match", age: 7) }
    func testPatterns() async throws { try await exercise("patterns", age: 7) }
    func testSorting() async throws { try await exercise("sorting", age: 7) }
    func testOddOneOut() async throws { try await exercise("odd-one-out", age: 7) }
    func testMemory() async throws { try await exercise("memory", age: 7) }
    func testMaze() async throws { try await exercise("maze", age: 7) }
    func testCompare() async throws { try await exercise("compare", age: 7) }
    func testNumberOrder() async throws { try await exercise("number-order", age: 7) }
    func testSubtraction() async throws { try await exercise("subtraction", age: 7) }
    func testNumberBonds() async throws { try await exercise("number-bonds", age: 7) }
    func testTenFrame() async throws { try await exercise("ten-frame", age: 7) }
    func testLetterMatch() async throws { try await exercise("letter-match", age: 7) }
    func testWordBuild() async throws { try await exercise("word-build", age: 7) }
    func testSizeOrder() async throws { try await exercise("size-order", age: 7) }
    func testPictureSequence() async throws { try await exercise("picture-sequence", age: 7) }
    func testDirections() async throws { try await exercise("directions", age: 7) }
    func testMakeAShape() async throws { try await exercise("make-a-shape", age: 7) }
    func testRhythm() async throws { try await exercise("rhythm", age: 7) }
    func testSharing() async throws { try await exercise("sharing", age: 7) }
}

final class NativeGameplayAge08Tests: NativeGameplayCase {
    func testDraw() async throws { try await exercise("draw", age: 8) }
    func testColoring() async throws { try await exercise("coloring", age: 8) }
    func testPrewriting() async throws { try await exercise("prewriting", age: 8) }
    func testUppercase() async throws { try await exercise("uppercase", age: 8) }
    func testLowercase() async throws { try await exercise("lowercase", age: 8) }
    func testWordTracing() async throws { try await exercise("word-tracing", age: 8) }
    func testNumberTracing() async throws { try await exercise("number-tracing", age: 8) }
    func testCounting() async throws { try await exercise("counting", age: 8) }
    func testAddition() async throws { try await exercise("addition", age: 8) }
    func testEqualGroups() async throws { try await exercise("equal-groups", age: 8) }
    func testShapeMatch() async throws { try await exercise("shape-match", age: 8) }
    func testColorMatch() async throws { try await exercise("color-match", age: 8) }
    func testPatterns() async throws { try await exercise("patterns", age: 8) }
    func testSorting() async throws { try await exercise("sorting", age: 8) }
    func testOddOneOut() async throws { try await exercise("odd-one-out", age: 8) }
    func testMemory() async throws { try await exercise("memory", age: 8) }
    func testMaze() async throws { try await exercise("maze", age: 8) }
    func testCompare() async throws { try await exercise("compare", age: 8) }
    func testNumberOrder() async throws { try await exercise("number-order", age: 8) }
    func testSubtraction() async throws { try await exercise("subtraction", age: 8) }
    func testNumberBonds() async throws { try await exercise("number-bonds", age: 8) }
    func testTenFrame() async throws { try await exercise("ten-frame", age: 8) }
    func testLetterMatch() async throws { try await exercise("letter-match", age: 8) }
    func testWordBuild() async throws { try await exercise("word-build", age: 8) }
    func testSizeOrder() async throws { try await exercise("size-order", age: 8) }
    func testPictureSequence() async throws { try await exercise("picture-sequence", age: 8) }
    func testDirections() async throws { try await exercise("directions", age: 8) }
    func testMakeAShape() async throws { try await exercise("make-a-shape", age: 8) }
    func testRhythm() async throws { try await exercise("rhythm", age: 8) }
    func testSharing() async throws { try await exercise("sharing", age: 8) }
}

final class NativeGameplayAge09Tests: NativeGameplayCase {
    func testDraw() async throws { try await exercise("draw", age: 9) }
    func testColoring() async throws { try await exercise("coloring", age: 9) }
    func testPrewriting() async throws { try await exercise("prewriting", age: 9) }
    func testUppercase() async throws { try await exercise("uppercase", age: 9) }
    func testLowercase() async throws { try await exercise("lowercase", age: 9) }
    func testWordTracing() async throws { try await exercise("word-tracing", age: 9) }
    func testNumberTracing() async throws { try await exercise("number-tracing", age: 9) }
    func testCounting() async throws { try await exercise("counting", age: 9) }
    func testAddition() async throws { try await exercise("addition", age: 9) }
    func testEqualGroups() async throws { try await exercise("equal-groups", age: 9) }
    func testShapeMatch() async throws { try await exercise("shape-match", age: 9) }
    func testColorMatch() async throws { try await exercise("color-match", age: 9) }
    func testPatterns() async throws { try await exercise("patterns", age: 9) }
    func testSorting() async throws { try await exercise("sorting", age: 9) }
    func testOddOneOut() async throws { try await exercise("odd-one-out", age: 9) }
    func testMemory() async throws { try await exercise("memory", age: 9) }
    func testMaze() async throws { try await exercise("maze", age: 9) }
    func testCompare() async throws { try await exercise("compare", age: 9) }
    func testNumberOrder() async throws { try await exercise("number-order", age: 9) }
    func testSubtraction() async throws { try await exercise("subtraction", age: 9) }
    func testNumberBonds() async throws { try await exercise("number-bonds", age: 9) }
    func testTenFrame() async throws { try await exercise("ten-frame", age: 9) }
    func testLetterMatch() async throws { try await exercise("letter-match", age: 9) }
    func testWordBuild() async throws { try await exercise("word-build", age: 9) }
    func testSizeOrder() async throws { try await exercise("size-order", age: 9) }
    func testPictureSequence() async throws { try await exercise("picture-sequence", age: 9) }
    func testDirections() async throws { try await exercise("directions", age: 9) }
    func testMakeAShape() async throws { try await exercise("make-a-shape", age: 9) }
    func testRhythm() async throws { try await exercise("rhythm", age: 9) }
    func testSharing() async throws { try await exercise("sharing", age: 9) }
}

final class NativeGameplayAge10Tests: NativeGameplayCase {
    func testDraw() async throws { try await exercise("draw", age: 10) }
    func testColoring() async throws { try await exercise("coloring", age: 10) }
    func testPrewriting() async throws { try await exercise("prewriting", age: 10) }
    func testUppercase() async throws { try await exercise("uppercase", age: 10) }
    func testLowercase() async throws { try await exercise("lowercase", age: 10) }
    func testWordTracing() async throws { try await exercise("word-tracing", age: 10) }
    func testNumberTracing() async throws { try await exercise("number-tracing", age: 10) }
    func testCounting() async throws { try await exercise("counting", age: 10) }
    func testAddition() async throws { try await exercise("addition", age: 10) }
    func testEqualGroups() async throws { try await exercise("equal-groups", age: 10) }
    func testShapeMatch() async throws { try await exercise("shape-match", age: 10) }
    func testColorMatch() async throws { try await exercise("color-match", age: 10) }
    func testPatterns() async throws { try await exercise("patterns", age: 10) }
    func testSorting() async throws { try await exercise("sorting", age: 10) }
    func testOddOneOut() async throws { try await exercise("odd-one-out", age: 10) }
    func testMemory() async throws { try await exercise("memory", age: 10) }
    func testMaze() async throws { try await exercise("maze", age: 10) }
    func testCompare() async throws { try await exercise("compare", age: 10) }
    func testNumberOrder() async throws { try await exercise("number-order", age: 10) }
    func testSubtraction() async throws { try await exercise("subtraction", age: 10) }
    func testNumberBonds() async throws { try await exercise("number-bonds", age: 10) }
    func testTenFrame() async throws { try await exercise("ten-frame", age: 10) }
    func testLetterMatch() async throws { try await exercise("letter-match", age: 10) }
    func testWordBuild() async throws { try await exercise("word-build", age: 10) }
    func testSizeOrder() async throws { try await exercise("size-order", age: 10) }
    func testPictureSequence() async throws { try await exercise("picture-sequence", age: 10) }
    func testDirections() async throws { try await exercise("directions", age: 10) }
    func testMakeAShape() async throws { try await exercise("make-a-shape", age: 10) }
    func testRhythm() async throws { try await exercise("rhythm", age: 10) }
    func testSharing() async throws { try await exercise("sharing", age: 10) }
}

// Uses UIKit's public geometry request, then measures both native layout and
// CSS env() in the packaged page. This is a layout test, not a touch simulation.
final class NativeLayoutTests: NativeGameplayCase {
    private struct LayoutError: LocalizedError {
        let message: String
        var errorDescription: String? { message }
    }

    private func orient(_ orientation: UIInterfaceOrientation, scene: UIWindowScene, controller: DoodleViewController, window: UIWindow) async throws {
        let mask: UIInterfaceOrientationMask = orientation == .portrait ? .portrait : .landscapeLeft
        var requestError: Error?
        controller.setNeedsUpdateOfSupportedInterfaceOrientations()
        scene.requestGeometryUpdate(.iOS(interfaceOrientations: mask)) { requestError = $0 }
        let deadline = Date().addingTimeInterval(12)
        while Date() < deadline {
            if let requestError { throw requestError }
            window.layoutIfNeeded()
            controller.view.layoutIfNeeded()
            let isLandscape = window.bounds.width > window.bounds.height
            if scene.interfaceOrientation == orientation && isLandscape == orientation.isLandscape {
                // UIKit can report the orientation before its transition ends.
                if controller.transitionCoordinator == nil {
                    try await Task.sleep(nanoseconds: 100_000_000)
                    window.layoutIfNeeded()
                    controller.view.layoutIfNeeded()
                    if scene.interfaceOrientation == orientation && (window.bounds.width > window.bounds.height) == orientation.isLandscape { return }
                }
            }
            try await Task.sleep(nanoseconds: 50_000_000)
        }
        throw LayoutError(message: "Geometry request did not reach \(orientation.rawValue); actual orientation \(scene.interfaceOrientation.rawValue), bounds \(window.bounds)")
    }

    func testLandscapeSafeAreasAndLowerActivityControls() async throws {
        guard let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first(where: { $0.activationState == .foregroundActive }) else {
            throw LayoutError(message: "A foreground UIWindowScene is required for real geometry updates")
        }
        let controller = DoodleViewController()
        let window = UIWindow(windowScene: scene)
        window.frame = scene.coordinateSpace.bounds
        var report: [String: Any] = ["test": "landscape safe areas and lower controls", "age": 6, "interaction": "Public UIKit geometry update plus native WKWebView DOM layout measurements"]
        var testError: Error?
        defer {
            controller.onContentReady = nil
            controller.webView?.stopLoading()
            window.isHidden = true
            window.rootViewController = nil
        }
        do {
            try await loadReady(controller, label: "layout: packaged page ready") {
                window.rootViewController = controller
                window.makeKeyAndVisible()
                controller.loadViewIfNeeded()
            }
            _ = try await evaluate("""
                (() => {
                  for (const key of Object.keys(localStorage)) if (key.startsWith('doodle-fun:v2:')) localStorage.removeItem(key);
                  localStorage.setItem('doodle-fun:v2:settings', JSON.stringify({age:6,level:'auto',sound:false,challengeOffset:0}));
                  return true;
                })()
                """, in: controller.webView, label: "layout: exact age six settings")
            try await loadReady(controller, label: "layout: reload settings") { controller.webView.reload() }
            try await orient(.landscapeLeft, scene: scene, controller: controller, window: window)
            report["nativeLandscape"] = nativeGeometry(controller, window: window)
            report["interfaceOrientation"] = scene.interfaceOrientation.rawValue

            let script = #"""
                const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
                const settle = async () => { await frame(); await frame(); };
                const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
                const wait = async (predicate, label) => {
                  const end = performance.now() + 4000;
                  while (performance.now() < end) { if (predicate()) return; await pause(20); }
                  throw new Error(`Timed out: ${label}`);
                };
                const shown = node => Boolean(node && node.getClientRects().length && !node.closest('[hidden]'));
                const scrollToStableVisibleRect = async (button, label) => {
                  button.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
                  const end = performance.now() + 4000;
                  let previous = null, stableFrames = 0, rect;
                  while (performance.now() < end) {
                    await frame(); await pause(20);
                    rect = button.getBoundingClientRect();
                    const visible = shown(button) && rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= innerHeight;
                    const coordinates = [rect.left,rect.right,rect.top,rect.bottom];
                    const stable = previous && coordinates.every((value,index) => Math.abs(value - previous[index]) < 0.5);
                    stableFrames = visible && stable ? stableFrames + 1 : 0;
                    if (stableFrames >= 3) return rect;
                    previous = coordinates;
                  }
                  throw new Error(`Control did not become visible and stable after scrolling: ${label}; rect=${JSON.stringify(rect?.toJSON())}; viewport=${innerWidth}x${innerHeight}; scrollY=${scrollY}`);
                };
                const cssInsets = () => {
                  const probe = document.createElement('div');
                  probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right);padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left)';
                  document.body.append(probe);
                  try {
                    const value = getComputedStyle(probe);
                    return {top:parseFloat(value.paddingTop),right:parseFloat(value.paddingRight),bottom:parseFloat(value.paddingBottom),left:parseFloat(value.paddingLeft)};
                  } finally { probe.remove(); }
                };
                await settle();
                if (location.protocol !== 'file:' || innerWidth <= innerHeight) throw new Error('Expected the packaged page in landscape');
                const output = {viewport:{width:innerWidth,height:innerHeight,scale:visualViewport?.scale},cssInsets:cssInsets(),activities:[]};
                const routes = [
                  {id:'shape-match',controls:'.discover-footer button',back:'.discover-back'},
                  {id:'size-order',controls:'.adventure-footer button',back:'.adventure-back'},
                  {id:'uppercase',controls:'.learn-tools button,.learn-navigation button',back:'.learn-back'},
                  {id:'counting',controls:'.learn-count-coach,.learn-next-puzzle',back:'.learn-back'},
                  {id:'compare',controls:'.challenge-footer button',back:'.challenge-header [aria-label="Back to activities"]'}
                ];
                for (const route of routes) {
                  const card = document.querySelector(`#card-${route.id}`);
                  if (!shown(card)) throw new Error(`Missing visible catalog card ${route.id}`);
                  card.click();
                  await wait(() => location.hash === `#${route.id}` && [...document.querySelectorAll(route.controls)].some(shown), route.id);
                  await settle();
                  const buttons = [...document.querySelectorAll(route.controls)].filter(shown);
                  if (buttons.length < 2) throw new Error(`Missing lower controls for ${route.id}`);
                  const activity = {id:route.id,cssInsets:cssInsets(),viewportWidth:innerWidth,pageScrollWidth:document.documentElement.scrollWidth,controls:[]};
                  for (const button of buttons) {
                    const rect = await scrollToStableVisibleRect(button, `${route.id} / ${button.textContent.trim()}`);
                    activity.controls.push({label:button.getAttribute('aria-label')||button.textContent.trim(),left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:rect.width,height:rect.height,visible:shown(button)&&rect.top>=0&&rect.bottom<=innerHeight});
                  }
                  output.activities.push(activity);
                  const back = document.querySelector(route.back);
                  if (!shown(back)) throw new Error(`Missing back control ${route.id}`);
                  back.click();
                  await wait(() => shown(document.querySelector(`#card-${route.id}`)), `${route.id} return`);
                }
                return output;
                """#
            let finished = expectation(description: "layout: landscape DOM measurements")
            var outcome: Result<Any, Error>?
            controller.webView.callAsyncJavaScript(script, arguments: [:], in: nil, in: .page) { result in
                outcome = result
                finished.fulfill()
            }
            await fulfillment(of: [finished], timeout: 35)
            guard let outcome else { throw LayoutError(message: "Landscape DOM measurements timed out") }
            guard let web = try outcome.get() as? [String: Any] else { throw LayoutError(message: "Landscape DOM measurements returned no report") }
            report["webLandscape"] = web
            let safe = controller.view.safeAreaInsets
            let nativeInsets = ["left":Double(safe.left),"right":Double(safe.right),"top":Double(safe.top),"bottom":Double(safe.bottom)]
            let nativeWindowInsets = ["left":Double(window.safeAreaInsets.left),"right":Double(window.safeAreaInsets.right),"top":Double(window.safeAreaInsets.top),"bottom":Double(window.safeAreaInsets.bottom)]
            let nativeWidth = Double(controller.view.bounds.width)
            XCTAssertGreaterThan(controller.view.bounds.width, controller.view.bounds.height, "The regression must actually run in landscape")
            guard let css = web["cssInsets"] as? [String: Double], let viewport = web["viewport"] as? [String: Double], let activities = web["activities"] as? [[String: Any]] else { throw LayoutError(message: "Incomplete measured layout report") }
            XCTAssertEqual(viewport["width"] ?? -1, nativeWidth, accuracy: 0.5, "Web CSS pixels must map to native points")
            for edge in ["left","right","top","bottom"] {
                XCTAssertEqual(css[edge] ?? -1, nativeInsets[edge]!, accuracy: 0.5, "CSS env(\(edge)) must match the actual native safe area")
                XCTAssertEqual(nativeWindowInsets[edge]!, nativeInsets[edge]!, accuracy: 0.5, "Window and edge-to-edge controller safe areas must agree")
            }
            XCTAssertEqual(activities.count, 5, "Discovery, adventures, both learning layouts and challenges must be measured")
            for activity in activities {
                let id = activity["id"] as? String ?? "unknown"
                guard let controls = activity["controls"] as? [[String: Any]], let routeInsets = activity["cssInsets"] as? [String: Double] else { throw LayoutError(message: "Missing control measurements for \(id)") }
                XCTAssertLessThanOrEqual(activity["pageScrollWidth"] as? Double ?? .infinity, nativeWidth + 1, "\(id) has no horizontal page overflow")
                for edge in ["left","right","top","bottom"] { XCTAssertEqual(routeInsets[edge] ?? -1, nativeInsets[edge]!, accuracy: 0.5, "\(id): CSS safe area stays aligned") }
                for control in controls {
                    let label = control["label"] as? String ?? "unknown"
                    XCTAssertEqual(control["visible"] as? Bool, true, "\(id) / \(label) is visible after scrolling")
                    XCTAssertGreaterThanOrEqual(control["width"] as? Double ?? 0, 48, "\(id) / \(label) keeps its touch width")
                    XCTAssertGreaterThanOrEqual(control["left"] as? Double ?? -.infinity, nativeInsets["left"]! - 0.5, "\(id) / \(label) stays right of the actual left unsafe edge")
                    XCTAssertLessThanOrEqual(control["right"] as? Double ?? .infinity, nativeWidth - nativeInsets["right"]! + 0.5, "\(id) / \(label) stays left of the actual right unsafe edge")
                }
            }
        } catch { testError = error; report["error"] = error.localizedDescription }

        // Restoration is awaited even after a measurement or assertion failure.
        // Other gameplay/UI cases must never inherit this test's landscape state.
        do {
            try await orient(.portrait, scene: scene, controller: controller, window: window)
            report["restoredPortrait"] = nativeGeometry(controller, window: window)
            XCTAssertEqual(scene.interfaceOrientation, .portrait, "Restore portrait before the next native test")
        } catch {
            report["portraitRestoreError"] = error.localizedDescription
            XCTFail("Could not restore portrait after landscape regression: \(error.localizedDescription)")
            if testError == nil { testError = error }
        }
        attachReport(report, name: "Native landscape UIKit and CSS safe area regression")
        if let data = try? JSONSerialization.data(withJSONObject: report, options: [.sortedKeys]), let line = String(data: data, encoding: .utf8) { print("NATIVE_LANDSCAPE_LAYOUT \(line)") }
        if let testError { throw testError }
    }
}
