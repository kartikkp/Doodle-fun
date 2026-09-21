import XCTest
import AVFoundation
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

    func testExternalDestinationsRequireExactApprovedURLs() {
        let allowed = [
            "https://kartikkp.github.io/Doodle-fun/privacy.html",
            "https://kartikkp.github.io/Doodle-fun/support.html",
            "https://github.com/kartikkp/Doodle-fun/issues",
            "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
        ]
        for value in allowed {
            XCTAssertEqual(NativeBridgePolicy.externalURL(value)?.absoluteString, value)
            for changed in [value + "?next=https://example.com", value + "#extra", value + "/", value.replacingOccurrences(of: "https:", with: "http:")] {
                XCTAssertNil(NativeBridgePolicy.externalURL(changed), changed)
            }
        }
        for value in ["https://example.com", "https://kartikkp.github.io.evil.example/Doodle-fun/privacy.html", "https://github.com/kartikkp/Doodle-fun/issues/1", "javascript:alert(1)", "file:///index.html", "/privacy.html"] {
            XCTAssertNil(NativeBridgePolicy.externalURL(value), value)
        }
        XCTAssertNil(NativeBridgePolicy.externalURL(42))
    }

    func testParentChallengeUsesTwoDigitOperandsAndRejectsWrongOrMalformedAnswers() {
        let challenge = NativeBridgePolicy.ParentChallenge(left: 12, right: 19)
        XCTAssertTrue(challenge.accepts("228"))
        XCTAssertTrue(challenge.accepts(" 228 \n"))
        for answer in ["", "0", "227", "229", "228.0", "2.28e2", "+228", "228<script>", "222228"] {
            XCTAssertFalse(challenge.accepts(answer), answer)
        }
        XCTAssertFalse(challenge.prompt.contains("228"), "The prompt must not reveal the answer.")
        for _ in 0..<50 {
            let fresh = NativeBridgePolicy.ParentChallenge()
            XCTAssertTrue((12...19).contains(fresh.left))
            XCTAssertTrue((12...19).contains(fresh.right))
        }
    }

    @MainActor
    func testGameAudioBridgeActivatesOutputOnlyPlaybackAndRejectsInactiveRequests() async throws {
        let controller = DoodleViewController()
        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }, "A foreground scene is required for measured device geometry.")
        let window = UIWindow(windowScene: scene)
        window.frame = scene.coordinateSpace.bounds
        let loaded = expectation(description: "Game audio bridge packaged page loaded")
        controller.onContentReady = { [weak controller] in controller?.onContentReady = nil; loaded.fulfill() }
        window.rootViewController = controller
        window.makeKeyAndVisible()
        defer {
            NotificationCenter.default.post(name: UIApplication.didBecomeActiveNotification, object: nil)
            controller.webView.stopLoading()
            window.isHidden = true
            window.rootViewController = nil
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        }
        controller.loadViewIfNeeded()
        await fulfillment(of: [loaded], timeout: 30)
        window.layoutIfNeeded()
        controller.view.layoutIfNeeded()
        controller.webView.layoutIfNeeded()
        func bounds(_ rect: CGRect) -> [String: Double] {
            ["x": Double(rect.origin.x), "y": Double(rect.origin.y), "width": Double(rect.width), "height": Double(rect.height)]
        }
        func insets(_ edges: UIEdgeInsets) -> [String: Double] {
            ["top": Double(edges.top), "right": Double(edges.right), "bottom": Double(edges.bottom), "left": Double(edges.left)]
        }
        let geometry: [String: Any] = [
            "unit": "UIKit points", "systemVersion": UIDevice.current.systemVersion,
            "interfaceOrientation": scene.interfaceOrientation.rawValue,
            "windowBounds": bounds(window.bounds), "windowSafeAreaInsets": insets(window.safeAreaInsets),
            "viewBounds": bounds(controller.view.bounds), "viewSafeAreaInsets": insets(controller.view.safeAreaInsets),
            "webViewBounds": bounds(controller.webView.bounds), "webViewSafeAreaInsets": insets(controller.webView.safeAreaInsets),
            "statusBarFrame": bounds(scene.statusBarManager?.statusBarFrame ?? .zero),
            "statusBarHidden": scene.statusBarManager?.isStatusBarHidden ?? true
        ]
        let geometryData = try JSONSerialization.data(withJSONObject: geometry, options: [.prettyPrinted, .sortedKeys])
        let geometryAttachment = XCTAttachment(data: geometryData, uniformTypeIdentifier: "public.json")
        geometryAttachment.name = "Native audio portrait UIKit geometry"
        geometryAttachment.lifetime = .keepAlways
        add(geometryAttachment)
        let geometryLine = try JSONSerialization.data(withJSONObject: geometry, options: [.sortedKeys])
        print("NATIVE_AUDIO_PORTRAIT_GEOMETRY \(String(decoding: geometryLine, as: UTF8.self))")
        XCTAssertEqual(scene.interfaceOrientation, .portrait, "The device profile must be measured in portrait.")
        XCTAssertGreaterThan(window.bounds.height, window.bounds.width)
        let session = AVAudioSession.sharedInstance()
        XCTAssertEqual(session.category, .playback)
        XCTAssertEqual(session.mode, .default)
        XCTAssertEqual(session.categoryOptions, [.mixWithOthers])
        XCTAssertNil(Bundle.main.object(forInfoDictionaryKey: "NSMicrophoneUsageDescription"))
        XCTAssertFalse((Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String] ?? []).contains("audio"))

        func request(_ type: String) async throws -> [String: Any] {
            let value = try await controller.webView.callAsyncJavaScript("""
                return await window.webkit.messageHandlers.doodleAudio.postMessage({type});
                """, arguments: ["type": type], in: nil, contentWorld: .page)
            return try XCTUnwrap(value as? [String: Any])
        }
        let unsupported = try await request("not-an-audio-action")
        XCTAssertEqual(unsupported["ok"] as? Bool, false)
        XCTAssertEqual(unsupported["reason"] as? String, "unsupported-action")

        let prepared = try await request("prepareGameAudio")
        XCTAssertEqual(prepared["ok"] as? Bool, true, "Activation must succeed before JavaScript schedules audio: \(prepared)")
        XCTAssertEqual(prepared["category"] as? String, AVAudioSession.Category.playback.rawValue)
        XCTAssertEqual(prepared["mode"] as? String, AVAudioSession.Mode.default.rawValue)
        XCTAssertEqual(session.categoryOptions, [.mixWithOthers])
        let volume = try XCTUnwrap(prepared["outputVolume"] as? Double)
        XCTAssertTrue((0...1).contains(volume))
        XCTAssertNotNil(prepared["outputs"] as? [String], "Report route types without device names; this does not prove physical audibility.")

        // UIKit may still report active while resignation is being delivered.
        // The native lifecycle guard must reject this interval too.
        NotificationCenter.default.post(name: UIApplication.willResignActiveNotification, object: nil)
        let inactive = try await request("prepareGameAudio")
        XCTAssertEqual(inactive["ok"] as? Bool, false)
        XCTAssertEqual(inactive["reason"] as? String, "inactive")
        NotificationCenter.default.post(name: UIApplication.didBecomeActiveNotification, object: nil)
        let resumed = try await request("prepareGameAudio")
        XCTAssertEqual(resumed["ok"] as? Bool, true, "A fresh foreground request can reactivate playback.")
    }

    @MainActor
    func testNativeInactivityPausesVisibleListeningAndRedeliversOnReturn() async throws {
        let controller = DoodleViewController()
        let window = UIWindow(frame: UIScreen.main.bounds)
        let loaded = expectation(description: "Listening lifecycle page loaded")
        controller.onContentReady = { [weak controller] in controller?.onContentReady = nil; loaded.fulfill() }
        window.rootViewController = controller
        window.makeKeyAndVisible()
        defer { window.isHidden = true; window.rootViewController = nil }
        controller.loadViewIfNeeded()
        await fulfillment(of: [loaded], timeout: 30)
        _ = try await controller.webView.callAsyncJavaScript("""
            location.hash = 'beat-studio';
            const deadline = performance.now() + 5000;
            while (!document.querySelector('.listening-screen')) {
              if (performance.now() > deadline) throw new Error('Beat studio did not open');
              await new Promise(resolve => setTimeout(resolve, 20));
            }
            window.nativePauseEvents = [];
            addEventListener('doodle-native-inactive', () => nativePauseEvents.push(document.visibilityState));
            return true;
            """, arguments: [:], in: nil, contentWorld: .page)
        let visible = try await controller.webView.evaluateJavaScript("document.visibilityState") as? String
        XCTAssertEqual(visible, "visible", "This regression must not depend on document visibility changing.")

        NotificationCenter.default.post(name: UIApplication.willResignActiveNotification, object: nil)
        let paused = try await controller.webView.evaluateJavaScript("document.querySelector('[data-testid=\"listening-feedback\"]').textContent") as? String
        XCTAssertEqual(paused, "Sound paused. Tap Listen when you are ready to continue.")
        // Reset the visible practice to prove foreground delivery reaches the
        // controller again, even if the background notification was deferred.
        _ = try await controller.webView.evaluateJavaScript("document.querySelector('.listening-actions button').click(); true")
        NotificationCenter.default.post(name: UIApplication.didBecomeActiveNotification, object: nil)
        let returned = try await controller.webView.evaluateJavaScript("document.querySelector('[data-testid=\"listening-feedback\"]').textContent") as? String
        XCTAssertEqual(returned, paused)
        let locked = try await controller.webView.evaluateJavaScript("document.querySelector('[data-listening-drum]').disabled") as? Bool
        XCTAssertEqual(locked, true)
        NotificationCenter.default.post(name: UIApplication.didBecomeActiveNotification, object: nil)
        let events = try await controller.webView.evaluateJavaScript("nativePauseEvents") as? [String]
        XCTAssertEqual(events, ["visible", "visible"], "One inactive transition is redelivered once on return, without requiring hidden web content.")
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

@MainActor
final class NativeParentGateTests: XCTestCase {
    private func loadedController() async throws -> (DoodleViewController, UIWindow) {
        let controller = DoodleViewController()
        let window = UIWindow(frame: UIScreen.main.bounds)
        let loaded = expectation(description: "Parental gate test bundled page loaded")
        controller.onContentReady = { [weak controller] in controller?.onContentReady = nil; loaded.fulfill() }
        window.rootViewController = controller
        window.makeKeyAndVisible()
        controller.loadViewIfNeeded()
        await fulfillment(of: [loaded], timeout: 30)
        XCTAssertEqual(UIApplication.shared.applicationState, .active)
        _ = try await controller.webView.evaluateJavaScript("""
            window.gateShareResults = []; window.gateExternalResults = [];
            addEventListener('doodle-native-share', event => gateShareResults.push(event.detail.status));
            addEventListener('doodle-native-external', event => gateExternalResults.push(event.detail.status));
            true;
            """)
        return (controller, window)
    }

    private func waitFor(_ predicate: () -> Bool) async throws {
        let deadline = Date().addingTimeInterval(5)
        while !predicate() && Date() < deadline { try await Task.sleep(nanoseconds: 20_000_000) }
        XCTAssertTrue(predicate(), "Expected native presentation state was not reached.")
    }

    private func gateIsReady(_ controller: DoodleViewController) -> Bool {
        guard let gate = controller.presentedViewController as? ParentGateViewController else { return false }
        return gate.isViewLoaded && gate.view.window != nil && !gate.isBeingPresented
    }

    private func postShare(_ controller: DoodleViewController, name: String = "gate-test-first.png") async throws {
        // Structured arguments exercise the public JS bridge directly, bypassing
        // any web button or web parental gate. Web-supplied approval is ignored.
        _ = try await controller.webView.callAsyncJavaScript("""
            const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2;
            canvas.getContext('2d').fillRect(0, 0, 2, 2);
            window.webkit.messageHandlers.doodleNative.postMessage({type:'shareImage', dataURL:canvas.toDataURL('image/png'), name, approved:true, answer:'228'});
            return true;
            """, arguments: ["name": name], in: nil, contentWorld: .page)
    }

    private func shareDirectories() throws -> Set<URL> {
        Set(try FileManager.default.contentsOfDirectory(at: FileManager.default.temporaryDirectory, includingPropertiesForKeys: nil)
            .filter { $0.lastPathComponent.hasPrefix("DoodleShare-") })
    }

    func testDirectShareCannotBypassGateAndCancelCreatesNoFiles() async throws {
        let (controller, window) = try await loadedController()
        defer { window.isHidden = true; window.rootViewController = nil }
        let before = try shareDirectories()
        try await postShare(controller)
        try await waitFor { gateIsReady(controller) }
        let gate = try XCTUnwrap(controller.presentedViewController as? ParentGateViewController)
        XCTAssertEqual(try shareDirectories(), before, "No export file exists before parental approval.")
        try await postShare(controller, name: "overlapping.png")
        XCTAssertTrue(controller.presentedViewController === gate, "A second request must not replace the pending payload or challenge.")
        gate.answerField.text = "0"
        gate.continueButton.sendActions(for: .touchUpInside)
        XCTAssertTrue(controller.presentedViewController === gate)
        XCTAssertTrue(gate.answerField.text?.isEmpty ?? true, "Wrong answers are cleared for a fresh challenge.")
        XCTAssertEqual(try shareDirectories(), before)
        gate.cancelButton.sendActions(for: .touchUpInside)
        try await waitFor { controller.presentedViewController == nil }
        let results = try await controller.webView.evaluateJavaScript("gateShareResults") as? [String]
        XCTAssertEqual(results, ["cancelled"])
        XCTAssertEqual(try shareDirectories(), before)
        try await postShare(controller)
        try await waitFor { gateIsReady(controller) }
        let next = try XCTUnwrap(controller.presentedViewController as? ParentGateViewController)
        XCTAssertFalse(next === gate, "Every request receives a new gate instance.")
        XCTAssertTrue(next.answerField.text?.isEmpty ?? true)
        next.cancelButton.sendActions(for: .touchUpInside)
        try await waitFor { controller.presentedViewController == nil }
    }

    func testCorrectAnswerSharesOnlyPendingImageAndApprovalCannotBeReused() async throws {
        let (controller, window) = try await loadedController()
        defer { window.isHidden = true; window.rootViewController = nil }
        let before = try shareDirectories()
        try await postShare(controller)
        try await waitFor { gateIsReady(controller) }
        let gate = try XCTUnwrap(controller.presentedViewController as? ParentGateViewController)
        try await postShare(controller, name: "overlapping.png")
        gate.answerField.text = String(gate.challenge.left * gate.challenge.right)
        gate.continueButton.sendActions(for: .touchUpInside)
        try await waitFor { controller.presentedViewController is UIActivityViewController && controller.presentedViewController?.isBeingPresented == false }
        let sheet = try XCTUnwrap(controller.presentedViewController as? UIActivityViewController)
        let created = try shareDirectories().subtracting(before)
        XCTAssertEqual(created.count, 1)
        let directory = try XCTUnwrap(created.first)
        let files = try FileManager.default.contentsOfDirectory(atPath: directory.path)
        XCTAssertEqual(files, ["gate-test-first.png"], "Approval stays bound to the first payload.")
        // UIKit completion is separately exercised through real XCUI sharing.
        sheet.completionWithItemsHandler?(nil, false, nil, nil)
        controller.dismiss(animated: false)
        try await waitFor { controller.presentedViewController == nil }
        XCTAssertEqual(try shareDirectories(), before, "Cancelling the share removes its temporary PNG.")
        try await postShare(controller)
        try await waitFor { gateIsReady(controller) }
        let next = try XCTUnwrap(controller.presentedViewController as? ParentGateViewController)
        XCTAssertFalse(next === gate)
        XCTAssertTrue(next.answerField.text?.isEmpty ?? true)
        next.cancelButton.sendActions(for: .touchUpInside)
        try await waitFor { controller.presentedViewController == nil }
    }

    func testBackgroundCancelsDirectExternalRequestAndStaleAnswerDoesNothing() async throws {
        let (controller, window) = try await loadedController()
        defer { window.isHidden = true; window.rootViewController = nil }
        _ = try await controller.webView.evaluateJavaScript("window.webkit.messageHandlers.doodleNative.postMessage({type:'openExternalURL',url:'https://kartikkp.github.io/Doodle-fun/privacy.html',approved:true}); true")
        try await waitFor { gateIsReady(controller) }
        let gate = try XCTUnwrap(controller.presentedViewController as? ParentGateViewController)
        NotificationCenter.default.post(name: UIApplication.willResignActiveNotification, object: nil)
        try await waitFor { controller.presentedViewController == nil }
        gate.answerField.text = String(gate.challenge.left * gate.challenge.right)
        gate.continueButton.sendActions(for: .touchUpInside)
        XCTAssertNil(controller.presentedViewController)
        let results = try await controller.webView.evaluateJavaScript("gateExternalResults") as? [String]
        XCTAssertEqual(results, ["cancelled"], "A backgrounded gate must never open an external app.")
    }

    func testDismissedOrNavigatedGateCancelsAndUnapprovedExternalURLNeverPresents() async throws {
        let (controller, window) = try await loadedController()
        defer { window.isHidden = true; window.rootViewController = nil }
        _ = try await controller.webView.evaluateJavaScript("window.webkit.messageHandlers.doodleNative.postMessage({type:'openExternalURL',url:'https://example.com'}); true")
        // Drain the bridge queue before inspecting the rejected operation.
        _ = try await controller.webView.evaluateJavaScript("true")
        XCTAssertNil(controller.presentedViewController)
        try await postShare(controller)
        try await waitFor { gateIsReady(controller) }
        let gate = try XCTUnwrap(controller.presentedViewController as? ParentGateViewController)
        gate.dismiss(animated: false)
        try await waitFor { controller.presentedViewController == nil }
        let results = try await controller.webView.evaluateJavaScript("gateShareResults") as? [String]
        XCTAssertEqual(results, ["cancelled"])
        XCTAssertNil(controller.presentedViewController)
        try await postShare(controller)
        try await waitFor { gateIsReady(controller) }
        _ = try await controller.webView.evaluateJavaScript("location.hash='memory'; true")
        try await waitFor { controller.presentedViewController == nil && controller.currentHash == "#memory" }
        let afterNavigation = try await controller.webView.evaluateJavaScript("gateShareResults") as? [String]
        XCTAssertEqual(afterNavigation, ["cancelled", "cancelled"], "Navigation invalidates a pending share.")
    }
}
