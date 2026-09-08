import XCTest

final class DoodleFunUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--reset-test-data"]
        app.launch()
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 30))
    }

    private func openDrawing() {
        let card = app.links["Doodle studio"]
        XCTAssertTrue(card.waitForExistence(timeout: 30))
        let web = app.webViews.firstMatch
        // Compact phones place this title below the first viewport. Bring its
        // observed frame into view before expecting a hittable coordinate.
        for _ in 0..<20 {
            let frame = card.frame
            let bounds = app.windows.firstMatch.frame.insetBy(dx: 12, dy: 40)
            if card.isHittable && bounds.contains(frame) { break }
            let down = !frame.isEmpty && frame.minY < bounds.minY
            web.coordinate(withNormalizedOffset: CGVector(dx: 0.04, dy: down ? 0.35 : 0.7))
                .press(forDuration: 0.05, thenDragTo: web.coordinate(withNormalizedOffset: CGVector(dx: 0.04, dy: down ? 0.7 : 0.35)))
        }
        let ready = XCTNSPredicateExpectation(predicate: NSPredicate(format: "hittable == true"), object: card)
        XCTAssertEqual(XCTWaiter.wait(for: [ready], timeout: 10), .completed)
        card.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        XCTAssertTrue(app.buttons["Save"].waitForExistence(timeout: 10))
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func tapParentButton(_ identifier: String) {
        let button = app.buttons[identifier]
        XCTAssertTrue(button.waitForExistence(timeout: 10))
        for _ in 0..<5 where !button.isHittable { app.scrollViews["DoodleParentScroll"].swipeUp() }
        XCTAssertTrue(button.isHittable)
        button.tap()
    }

    private func approveParentalGate() {
        let prompt = app.staticTexts["DoodleParentChallenge"]
        XCTAssertTrue(prompt.waitForExistence(timeout: 10), "Every share requires fresh native approval.")
        let operands = prompt.label.split(separator: " ").compactMap { Int($0) }
        XCTAssertEqual(operands.count, 2)
        guard operands.count == 2 else { return }
        let answer = app.textFields["DoodleParentAnswer"]
        XCTAssertTrue(answer.waitForExistence(timeout: 10))
        XCTAssertEqual(answer.value as? String, "Enter the answer", "No answer is retained from a previous approval.")
        answer.tap()
        answer.typeText(String(operands[0] * operands[1]))
        tapParentButton("DoodleParentContinue")
        XCTAssertTrue(prompt.waitForNonExistence(timeout: 10))
    }

    private func revealInfoControl(_ control: XCUIElement, towardTop: Bool = false) {
        XCTAssertTrue(control.waitForExistence(timeout: 10))
        let web = app.webViews.firstMatch
        func isVisible() -> Bool {
            // Use the actual viewport: the SE's fully visible Done button sits
            // within its bottom 70 points. A fixed inset kept swiping past it.
            let bounds = web.frame.intersection(app.windows.firstMatch.frame).insetBy(dx: 2, dy: 2)
            let frame = control.frame
            return control.isHittable && !frame.isEmpty && bounds.contains(frame)
        }
        for _ in 0..<14 {
            if isVisible() { return }
            let start = web.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: towardTop ? 0.35 : 0.7))
            let end = web.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: towardTop ? 0.7 : 0.35))
            start.press(forDuration: 0.05, thenDragTo: end)
        }
        capture("Information control could not be revealed: \(control.label)")
        XCTAssertTrue(isVisible(), "The information control must be fully visible and hittable.")
    }

    func testOfflinePrivacyAndSupportWebsiteRequiresNativeApproval() {
        let grownups = app.buttons["Grown-ups"]
        XCTAssertTrue(grownups.waitForExistence(timeout: 30))
        grownups.tap()
        let privacy = app.webViews.firstMatch.buttons.matching(NSPredicate(format: "label == %@", "Privacy policy")).firstMatch
        revealInfoControl(privacy)
        privacy.tap()
        let closePrivacy = app.buttons["Close privacy policy"]
        XCTAssertTrue(closePrivacy.waitForExistence(timeout: 10), "The privacy policy opens within the packaged app.")
        XCTAssertFalse(app.textFields["DoodleParentAnswer"].exists, "Reading the bundled policy needs no external action.")
        let policyText = app.webViews.firstMatch.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "does not send personal data, artwork, or practice progress to the developer")).firstMatch
        XCTAssertTrue(policyText.exists, "The policy includes its bundled text.")
        capture("Offline privacy policy in the native app")
        revealInfoControl(closePrivacy, towardTop: true)
        closePrivacy.tap()
        let support = app.webViews.firstMatch.buttons.matching(NSPredicate(format: "label == %@", "Help & support")).firstMatch
        revealInfoControl(support)
        support.tap()
        let visit = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Visit support website")).firstMatch
        revealInfoControl(visit)
        visit.tap()
        XCTAssertTrue(app.textFields["DoodleParentAnswer"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "https://kartikkp.github.io/Doodle-fun/support.html")).firstMatch.exists,
                      "The gate names the exact external destination.")
        capture("Native grown-up approval before leaving for support")
        tapParentButton("DoodleParentCancel")
        XCTAssertTrue(app.textFields["DoodleParentAnswer"].waitForNonExistence(timeout: 10))
        XCTAssertTrue(visit.exists, "Cancellation returns to the support information.")
        let closeSupport = app.buttons["Close help and support"]
        revealInfoControl(closeSupport, towardTop: true)
        closeSupport.tap()
        XCTAssertTrue(closeSupport.waitForNonExistence(timeout: 10))
        XCTAssertTrue(support.isHittable, "Closing support returns to the grown-up settings.")
        // The parent dialog retains its scroll position when nested information
        // closes. Use its nearby Done action rather than scrolling past the
        // interactive settings controls to the off-screen header.
        let done = app.webViews.firstMatch.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Let’s play")).firstMatch
        revealInfoControl(done)
        // Overscroll the settings deliberately: scrolling a modal at its end
        // must not move the home page underneath it.
        for _ in 0..<3 { app.webViews.firstMatch.swipeUp() }
        revealInfoControl(done)
        done.tap()
        XCTAssertTrue(done.waitForNonExistence(timeout: 10))
        let homeReady = XCTNSPredicateExpectation(predicate: NSPredicate(format: "hittable == true"), object: grownups)
        XCTAssertEqual(XCTWaiter.wait(for: [homeReady], timeout: 10), .completed)
    }

    func testOfflineLaunchCoachAndNavigation() {
        openDrawing()
        let coach = app.buttons.matching(NSPredicate(format: "label == 'Coach' OR identifier == 'coach-open'")).firstMatch
        XCTAssertTrue(coach.waitForExistence(timeout: 10))
        coach.tap()
        let close = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'Close coach'")).firstMatch
        XCTAssertTrue(close.waitForExistence(timeout: 10))
        capture("Native coaching")
        close.tap()
        app.buttons["Back to activities"].tap()
        XCTAssertTrue(app.links.matching(NSPredicate(format: "label CONTAINS[c] 'Doodle studio'")).firstMatch.waitForExistence(timeout: 10))
    }

    func testZNativeDrawingShareCanCancelAndOpenAgain() {
        openDrawing()
        // Touch the drawing paper, then follow the real Save -> native bridge path.
        let web = app.webViews.firstMatch
        web.coordinate(withNormalizedOffset: CGVector(dx: 0.35, dy: 0.55)).press(forDuration: 0.05, thenDragTo: web.coordinate(withNormalizedOffset: CGVector(dx: 0.6, dy: 0.65)))
        app.buttons["Save"].tap()
        let answer = app.textFields["DoodleParentAnswer"]
        XCTAssertTrue(answer.waitForExistence(timeout: 10))
        answer.tap()
        answer.typeText("0")
        tapParentButton("DoodleParentContinue")
        XCTAssertTrue(app.staticTexts["DoodleParentError"].waitForExistence(timeout: 10))
        capture("Native grown-up gate rejects an incorrect answer")
        tapParentButton("DoodleParentCancel")
        XCTAssertTrue(answer.waitForNonExistence(timeout: 10))
        XCTAssertTrue(app.buttons["Save"].isHittable, "Cancelling returns to the drawing.")
        for _ in 0..<2 {
            app.buttons["Save"].tap()
            approveParentalGate()
            // iOS 26 hosts the compact system sheet in SharingUIService.
            let systemShare = XCUIApplication(bundleIdentifier: "com.apple.SharingUIService")
            let marker = NSPredicate(format: "label CONTAINS[c] 'my-doodle'")
            let appMarker = app.descendants(matching: .any).matching(marker).firstMatch
            let systemMarker = systemShare.descendants(matching: .any).matching(marker).firstMatch
            let shareAction = appMarker.waitForExistence(timeout: 3) ? appMarker : systemMarker
            XCTAssertTrue(shareAction.waitForExistence(timeout: 15))
            capture("Native PNG share sheet")
            // iOS 26 presents a compact sheet without a Close button; tapping
            // outside dismisses both that sheet and the anchored iPad popover.
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.08, dy: 0.12)).tap()
            XCTAssertTrue(shareAction.waitForNonExistence(timeout: 10))
            XCTAssertTrue(app.buttons["Save"].waitForExistence(timeout: 10))
        }
        capture("Native drawing after sharing")
        app.buttons["Start a new drawing"].tap()
        let keep = app.buttons["Keep drawing"]
        XCTAssertTrue(keep.waitForExistence(timeout: 10))
        XCTAssertTrue(keep.isHittable)
        XCTAssertTrue(app.buttons["Start fresh"].isHittable)
        capture("Native new picture confirmation")
        keep.tap()
        XCTAssertTrue(app.buttons["Save"].isHittable)
    }

    func testProgressSettingsSurviveAppRelaunch() {
        let sound = app.descendants(matching: .any).matching(NSPredicate(format: "label == 'Turn on read aloud'")).firstMatch
        XCTAssertTrue(sound.waitForExistence(timeout: 30))
        sound.tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(NSPredicate(format: "label == 'Turn off read aloud'")).firstMatch.exists)
        app.terminate()
        app.launchArguments = []
        app.launch()
        XCTAssertTrue(app.descendants(matching: .any).matching(NSPredicate(format: "label == 'Turn off read aloud'")).firstMatch.waitForExistence(timeout: 30))
        app.descendants(matching: .any).matching(NSPredicate(format: "label == 'Turn off read aloud'")).firstMatch.tap()
    }
}
