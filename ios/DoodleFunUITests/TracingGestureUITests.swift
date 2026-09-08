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

    private func reveal(_ element: XCUIElement, drawingSurface: Bool = false) {
        let web = app.webViews.firstMatch
        for _ in 0..<24 {
            let window = app.windows.firstMatch.frame
            let top: CGFloat = window.height / window.width > 1.9 ? 62 : 20
            let bottom: CGFloat = window.height / window.width > 1.9 ? 34 : 0
            let bounds = CGRect(x: window.minX + 12, y: window.minY + top + 8,
                                width: window.width - 24, height: window.height - top - bottom - 16)
            let frame = element.frame
            if element.exists, !frame.isEmpty, bounds.contains(frame),
               drawingSurface || element.isHittable { return }
            let downward = element.exists && frame.minY < bounds.minY
            // A long swipe oscillated past the otherwise visible SE board.
            // Keep the entire board within measured phone margins using short
            // page-gutter gestures. Actual stroke/completion checks prove input.
            let distance = min(CGFloat(220), max(CGFloat(70), abs(frame.midY - bounds.midY)))
            let origin = web.coordinate(withNormalizedOffset: .zero)
            let upper = origin.withOffset(CGVector(dx: 12, dy: bounds.midY - distance / 2))
            let lower = origin.withOffset(CGVector(dx: 12, dy: bounds.midY + distance / 2))
            (downward ? upper : lower).press(forDuration: 0.05, thenDragTo: downward ? lower : upper)
        }
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Unreachable tracing target - \(element.label)"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        XCTFail("Could not bring \(element.label) fully into view.")
    }

    private func stroke(_ start: CGVector, _ end: CGVector) {
        let board = named("Trace the guide with a finger or Pencil")
        reveal(board, drawingSurface: true)
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
        reveal(board, drawingSurface: true)
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
        reveal(board, drawingSurface: true)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "Age \(age) — completed native finger tracing"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func testAgeTwoTrustedTracingRejectsTapAndCompletesBothStrokes() { play(age: 2) }
    func testAgeTenTrustedTracingRejectsTapAndCompletesBothStrokes() { play(age: 10) }
}
