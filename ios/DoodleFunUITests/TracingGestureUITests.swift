import XCTest

final class TracingGestureUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        app = XCUIApplication()
        app.launchArguments = ["--reset-test-data"]
        app.launch()
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 30))
    }

    override func tearDownWithError() throws { app.terminate() }

    private func named(_ label: String) -> XCUIElement {
        app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch
    }

    private func reveal(_ element: XCUIElement) {
        let web = app.webViews.firstMatch
        for _ in 0..<24 {
            let bounds = app.frame
            if element.exists, element.isHittable,
               element.frame.minY > bounds.minY + 100,
               element.frame.maxY < bounds.maxY - 35 { return }
            let downward = element.exists && element.frame.minY < bounds.minY + 100
            // Scroll in the page margin, outside the board's touch-action:none.
            web.coordinate(withNormalizedOffset: CGVector(dx: 0.99, dy: downward ? 0.25 : 0.8))
                .press(forDuration: 0.05, thenDragTo: web.coordinate(withNormalizedOffset: CGVector(dx: 0.99, dy: downward ? 0.8 : 0.25)))
        }
        XCTFail("Could not bring \(element.label) fully into view.")
    }

    private func stroke(_ start: CGVector, _ end: CGVector) {
        let board = named("Trace the guide with a finger or Pencil")
        reveal(board)
        board.coordinate(withNormalizedOffset: start).press(forDuration: 0.05, thenDragTo: board.coordinate(withNormalizedOffset: end))
    }

    private func play(age: Int) {
        let ageChoice = named("Age \(age)")
        XCTAssertTrue(ageChoice.waitForExistence(timeout: 20))
        reveal(ageChoice)
        ageChoice.tap()
        let card = app.links["Line & shape trails"]
        reveal(card)
        card.tap()
        let board = named("Trace the guide with a finger or Pencil")
        XCTAssertTrue(board.waitForExistence(timeout: 15))
        reveal(board)
        board.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.2)).tap()
        let check = app.buttons["Check tracing"]
        reveal(check)
        check.tap()
        XCTAssertTrue(check.isEnabled, "A stationary touch must not pass tracing.")
        let restart = app.buttons.matching(NSPredicate(format: "label CONTAINS 'Start again'")).firstMatch
        reveal(restart)
        restart.tap()
        stroke(CGVector(dx: 0.5, dy: 0.2), CGVector(dx: 0.5, dy: 0.8))
        let success = named("Beautiful practice! Your paths are complete. Pick another when you’re ready.")
        XCTAssertTrue(success.waitForExistence(timeout: 10), "A complete trusted finger gesture must pass at age \(age).")
        XCTAssertFalse(check.isEnabled)

        let cross = named("Cross")
        reveal(cross)
        cross.tap()
        stroke(CGVector(dx: 0.5, dy: 0.2), CGVector(dx: 0.5, dy: 0.8))
        XCTAssertTrue(check.isEnabled, "One of two strokes is incomplete.")
        stroke(CGVector(dx: 0.2, dy: 0.5), CGVector(dx: 0.8, dy: 0.5))
        XCTAssertTrue(success.waitForExistence(timeout: 10), "Both trusted strokes must complete the cross.")
        XCTAssertTrue(named("Cross, practiced").exists)
        reveal(board)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "Age \(age) — completed native finger tracing"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func testAgeTwoTrustedTracingRejectsTapAndCompletesBothStrokes() { play(age: 2) }
    func testAgeTenTrustedTracingRejectsTapAndCompletesBothStrokes() { play(age: 10) }
}
