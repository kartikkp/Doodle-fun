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
        let card = app.links.matching(NSPredicate(format: "label CONTAINS[c] %@", "Doodle studio")).firstMatch
        XCTAssertTrue(card.waitForExistence(timeout: 30))
        card.tap()
        XCTAssertTrue(app.buttons["Save"].waitForExistence(timeout: 10))
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
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
        for _ in 0..<2 {
            app.buttons["Save"].tap()
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
