import XCTest

/// Real WKWebView accessibility and XCUI gestures only. This catalog sweep
/// verifies launch, coaching, reachable controls, and return navigation; it is
/// separate from the tests that solve rounds or exercise native PNG sharing.
final class ActivityCatalogUITests: XCTestCase {
    private struct Activity {
        let id: String
        let title: String
        let heading: String
        let controlLabels: [String]

        init(_ id: String, _ title: String, heading: String? = nil, controls: [String]) {
            self.id = id
            self.title = title
            self.heading = heading ?? title
            self.controlLabels = controls
        }
    }

    // Keep this explicit list reviewable against catalog.js. Generic learning
    // headings are intentional; each card's practice-specific control is also
    // checked so opening the shared engine alone is not a successful launch.
    private static let activities: [Activity] = [
        Activity("draw", "Doodle studio", controls: ["Pen"]),
        Activity("coloring", "Color & create", controls: ["Fill"]),
        Activity("prewriting", "Line & shape trails", heading: "Letter adventures", controls: ["Check tracing"]),
        Activity("uppercase", "Big letter trails", heading: "Letter adventures", controls: ["Check tracing"]),
        Activity("lowercase", "Little letter trails", heading: "Letter adventures", controls: ["Check tracing"]),
        Activity("word-tracing", "Word trails", heading: "Letter adventures", controls: ["Check tracing"]),
        Activity("number-tracing", "Number trails", heading: "Letter adventures", controls: ["Check tracing"]),
        Activity("counting", "Count with me", heading: "Number explorers", controls: ["Show counting steps"]),
        Activity("addition", "Add together", heading: "Number explorers", controls: ["Show counting steps"]),
        Activity("equal-groups", "Equal groups", heading: "Number explorers", controls: ["Show counting steps"]),
        Activity("shape-match", "Shape detective", controls: ["New round", "New round →"]),
        Activity("color-match", "Color buddies", controls: ["New round", "New round →"]),
        Activity("patterns", "Pattern parade", controls: ["New round", "New round →"]),
        Activity("sorting", "Sort it out", controls: ["New round", "New round →"]),
        Activity("odd-one-out", "Spot the difference", controls: ["New round", "New round →"]),
        Activity("memory", "Memory garden", controls: ["New round", "New round →"]),
        Activity("maze", "Little pathfinder", controls: ["New round", "New round →"]),
        Activity("compare", "More, less, same", controls: ["New round →"]),
        Activity("number-order", "Number stepping stones", controls: ["New round →"]),
        Activity("subtraction", "Take away", controls: ["New round →"]),
        Activity("number-bonds", "Missing number", controls: ["New round →"]),
        Activity("ten-frame", "Fill the frame", controls: ["Check my frame"]),
        Activity("letter-match", "Letter buddies", controls: ["Show partners"]),
        Activity("word-build", "Build a word", controls: ["Show next letter"]),
        Activity("size-order", "Growing garden", controls: ["Next", "Next →"]),
        Activity("picture-sequence", "Story steps", controls: ["Next", "Next →"]),
        Activity("directions", "Follow the arrows", controls: ["Next", "Next →"]),
        Activity("make-a-shape", "Shape builder", controls: ["Next", "Next →"]),
        Activity("rhythm", "Tap the pattern", controls: ["Next", "Next →"]),
        Activity("sharing", "Fair shares", controls: ["Next", "Next →"]),
    ]

    private var app: XCUIApplication!
    private var portraitTopInset: CGFloat = 0
    private var hasHomeIndicator = false
    private var landscape = false

    override func setUpWithError() throws {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        app = XCUIApplication()
        app.launchArguments = ["--reset-test-data"]
        app.launch()
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 30))
        XCTAssertTrue(control(["Age 2"]).waitForExistence(timeout: 30))
        let frame = app.windows.firstMatch.frame
        XCTAssertLessThan(frame.width, frame.height, "The catalog pass starts in portrait")
        hasHomeIndicator = frame.height / frame.width > 1.9
        let statusBar = app.statusBars.firstMatch
        if statusBar.exists {
            portraitTopInset = max(0, statusBar.frame.maxY - frame.minY)
        } else if abs(frame.width - 402) < 1 && abs(frame.height - 874) < 1 {
            // The isolated iPhone QA pilot reports a 402×874 window and the
            // env(safe-area-inset-top)-positioned Coach at y=62. iOS 26 does
            // not expose a StatusBar in this app's AX tree. The old guessed
            // 64pt fallback falsely rejected this observed 62pt boundary.
            portraitTopInset = 62
        } else {
            XCTFail("No native StatusBar frame or verified safe-area geometry for \(frame.size)")
        }
        XCTAssertEqual(Self.activities.count, 30)
        XCTAssertEqual(Set(Self.activities.map(\.id)).count, 30)
    }

    override func tearDownWithError() throws {
        app?.terminate()
        XCUIDevice.shared.orientation = .portrait
    }

    private var web: XCUIElement { app.webViews.firstMatch }

    /// XCUI exposes native window/status-bar frames, but not safeAreaInsets.
    /// Reserve the phone's status-bar region and conservative home-indicator /
    /// landscape notch margins, then check the entire interactive target. The
    /// retained screenshots provide the complementary visual safe-area review.
    private var safeTapBounds: CGRect {
        let frame = app.windows.firstMatch.frame
        let side: CGFloat = landscape && hasHomeIndicator ? max(44, portraitTopInset) : 0
        let top: CGFloat = landscape ? 0 : portraitTopInset
        let bottom: CGFloat = hasHomeIndicator ? (landscape ? 21 : 34) : 0
        return CGRect(x: frame.minX + side, y: frame.minY + top,
                      width: frame.width - side * 2, height: frame.height - top - bottom)
    }

    private func control(_ labels: [String], identifier: String? = nil) -> XCUIElement {
        let predicate: NSPredicate
        if let identifier {
            predicate = NSPredicate(format: "label IN %@ OR identifier == %@", labels, identifier)
        } else {
            predicate = NSPredicate(format: "label IN %@", labels)
        }
        // iOS 26 exposes aria-pressed controls (ages, tools, trace choices) as
        // Switch rather than Button. Match the actual accessible name without
        // restricting the native type; regular buttons still match here.
        return web.descendants(matching: .any).matching(predicate).firstMatch
    }

    private func text(_ label: String) -> XCUIElement {
        let predicate = NSPredicate(format: "label == %@", label)
        let value = web.staticTexts.matching(predicate).firstMatch
        return value.exists ? value : web.descendants(matching: .any).matching(predicate).firstMatch
    }

    private func card(_ activity: Activity) -> XCUIElement {
        // Native WebKit also exposes an aggregate card Link containing all its
        // text. Pilot taps on that aggregate did not navigate. The nested title
        // Link is the actual, observed hit target on iOS 26.
        web.links.matching(NSPredicate(format: "label == %@", activity.title)).firstMatch
    }

    private enum ScrollDirection { case up, down }

    @discardableResult
    private func reveal(_ target: XCUIElement, toward preferred: ScrollDirection = .up,
                        inCoach: Bool = false, entireTarget: Bool = true,
                        file: StaticString = #filePath, line: UInt = #line) -> XCUIElement {
        var previousFrame: CGRect?
        var stationaryAttempts = 0
        for _ in 0..<28 {
            let bounds = safeTapBounds
            if target.exists && target.isHittable {
                let fits = entireTarget ? bounds.contains(target.frame) : bounds.contains(CGPoint(x: target.frame.midX, y: target.frame.midY))
                if fits { return target }
                stationaryAttempts = previousFrame == target.frame ? stationaryAttempts + 1 : 0
                if stationaryAttempts >= 3 { break }
            }
            previousFrame = target.exists ? target.frame : nil
            var direction = preferred
            if target.exists && !target.frame.isEmpty {
                if target.frame.minY < bounds.minY { direction = .down }
                else if target.frame.maxY > bounds.maxY { direction = .up }
            }
            // Outside the coach, drag the page gutter rather than a tracing
            // canvas or touch-controlled puzzle. In the modal, drag its body.
            let x = inCoach ? bounds.midX : bounds.minX + 7
            let lower = bounds.maxY - 45
            let upper = bounds.minY + 48
            let origin = web.coordinate(withNormalizedOffset: .zero)
            let start = origin.withOffset(CGVector(dx: x - web.frame.minX,
                                                   dy: (direction == .up ? lower : upper) - web.frame.minY))
            let finish = origin.withOffset(CGVector(dx: x - web.frame.minX,
                                                    dy: (direction == .up ? upper : lower) - web.frame.minY))
            start.press(forDuration: 0.05, thenDragTo: finish)
        }
        capture("Unreachable target - \(target.label)")
        let accessibility = XCTAttachment(string: app.debugDescription)
        accessibility.name = "Accessibility for unreachable \(target.label)"
        accessibility.lifetime = .keepAlways
        add(accessibility)
        XCTFail("Could not bring '\(target.label)' fully inside the phone tap area. Target: \(target.frame); allowed: \(safeTapBounds)", file: file, line: line)
        return target
    }

    private func assertTapTarget(_ target: XCUIElement, file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertTrue(target.exists, file: file, line: line)
        XCTAssertTrue(target.isEnabled, "\(target.label) is enabled", file: file, line: line)
        XCTAssertTrue(target.isHittable, "\(target.label) is reachable by touch", file: file, line: line)
        XCTAssertGreaterThanOrEqual(target.frame.width, 44, file: file, line: line)
        XCTAssertGreaterThanOrEqual(target.frame.height, 44, file: file, line: line)
        XCTAssertTrue(safeTapBounds.contains(target.frame), "\(target.label): \(target.frame), allowed: \(safeTapBounds)", file: file, line: line)
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func checkPracticeSelection(_ activity: Activity) {
        let practiceHeadings = ["prewriting":"Down", "uppercase":"Trace A", "lowercase":"Trace a",
                                "word-tracing":"Write “cat”", "number-tracing":"Trace 0"]
        if let heading = practiceHeadings[activity.id] {
            XCTAssertTrue(text(heading).waitForExistence(timeout: 10), "The requested practice opened: \(activity.id)")
        }
        let prompt: NSPredicate?
        switch activity.id {
        case "counting": prompt = NSPredicate(format: "label BEGINSWITH %@", "How many dots")
        case "addition": prompt = NSPredicate(format: "label CONTAINS %@ AND label ENDSWITH %@", " + ", " = ?")
        case "equal-groups": prompt = NSPredicate(format: "label CONTAINS %@ AND label ENDSWITH %@", " groups of ", ". How many?")
        default: prompt = nil
        }
        if let prompt {
            XCTAssertTrue(web.staticTexts.matching(prompt).firstMatch.waitForExistence(timeout: 10), "The requested number question opened: \(activity.id)")
        }
    }

    private func sweep(age: Int, inLandscape: Bool, keepScreenshots: Bool) {
        let ageButton = reveal(control(["Age \(age)"]), toward: .down)
        assertTapTarget(ageButton)
        ageButton.tap()
        XCTAssertEqual(ageButton.value as? String, "1", "The native age switch is selected")
        if inLandscape {
            XCUIDevice.shared.orientation = .landscapeLeft
            let rotated = NSPredicate { _, _ in self.app.windows.firstMatch.frame.width > self.app.windows.firstMatch.frame.height }
            XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: rotated, object: app)], timeout: 10), .completed)
            landscape = true
        }
        for activity in Self.activities {
            XCTContext.runActivity(named: "Age \(age) · \(inLandscape ? "landscape" : "portrait") · \(activity.title)") { _ in
                // Tap the card's observed title link. Its center must be
                // visible; full-size game controls are checked separately.
                let link = reveal(card(activity), entireTarget: false)
                XCTAssertTrue(link.isHittable)
                link.tap()
                if activity.id == "coloring" {
                    let page = web.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Color Sunshine")).firstMatch
                    XCTAssertTrue(page.waitForExistence(timeout: 10))
                    reveal(page, inCoach: true).tap()
                    let replace = control(["Start fresh"])
                    if replace.waitForExistence(timeout: 1) { reveal(replace, inCoach: true).tap() }
                    XCTAssertTrue(control(["Close coloring pages"]).waitForNonExistence(timeout: 10))
                }
                let heading = text(activity.heading)
                XCTAssertTrue(heading.waitForExistence(timeout: 10), "Expected heading: \(activity.heading)")
                reveal(heading, toward: .down)
                XCTAssertTrue(safeTapBounds.contains(heading.frame), "The activity heading fits on screen")
                checkPracticeSelection(activity)
                if keepScreenshots { capture("age-\(age)-\(inLandscape ? "landscape" : "portrait")-\(activity.id)-opening") }

                let playControl = reveal(control(activity.controlLabels))
                assertTapTarget(playControl)
                let coach = reveal(control(["Coach"], identifier: "coach-open"), toward: .down)
                assertTapTarget(coach)
                coach.tap()
                XCTAssertTrue(control(["Close coach"]).waitForExistence(timeout: 10))
                // renderCoach() replaces the shell placeholder with the
                // catalog activity title whenever this dialog is opened.
                XCTAssertTrue(text(activity.title).waitForExistence(timeout: 10))
                reveal(text(activity.title), toward: .down, inCoach: true)
                XCTAssertTrue(text("Start here").exists)
                XCTAssertTrue(text("Try a strategy").exists)
                let hint = reveal(control(["Show a hint in this game →"], identifier: "coach-hint"), inCoach: true)
                assertTapTarget(hint)
                hint.tap()
                XCTAssertTrue(control(["Close coach"]).waitForNonExistence(timeout: 10))

                let back = reveal(control(["Back to activities", "Back to home"]), toward: .down)
                assertTapTarget(back)
                back.tap()
                XCTAssertTrue(card(activity).waitForExistence(timeout: 10), "Returned to the catalog after \(activity.id)")
            }
        }
    }

    func testAge2PortraitCatalog() { sweep(age: 2, inLandscape: false, keepScreenshots: true) }
    func testAge6PortraitCatalog() { sweep(age: 6, inLandscape: false, keepScreenshots: false) }
    func testAge10PortraitCatalog() { sweep(age: 10, inLandscape: false, keepScreenshots: true) }
    func testAge6LandscapeCatalog() { sweep(age: 6, inLandscape: true, keepScreenshots: true) }
}
