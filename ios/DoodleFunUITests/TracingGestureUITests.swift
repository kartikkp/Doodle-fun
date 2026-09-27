import XCTest
import UIKit

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

    private func revealInHorizontalRail(_ element: XCUIElement, railLabel: String) {
        // iOS 18 WebKit appends the navigation role to this accessible label;
        // the retained native hierarchy records ", navigation" exactly.
        let rail = app.descendants(matching: .any).matching(
            NSPredicate(format: "label IN %@", [railLabel, railLabel + ", navigation"])
        ).firstMatch
        guard rail.waitForExistence(timeout: 15) else {
            let hierarchy = XCTAttachment(string: app.debugDescription)
            hierarchy.name = "Missing tracing rail - \(railLabel)"
            hierarchy.lifetime = .keepAlways
            add(hierarchy)
            XCTFail("The named scrolling rail must be accessible: \(railLabel)")
            return
        }
        for _ in 0..<16 {
            let window = app.windows.firstMatch
            let windowFrame = window.frame
            let top: CGFloat = windowFrame.height / windowFrame.width > 1.9 ? 62 : 20
            let bottom: CGFloat = windowFrame.height / windowFrame.width > 1.9 ? 34 : 0
            // The compact phone's navigation begins immediately below its
            // 20pt status bar. Extra page-content margins reject safe controls.
            let safeBounds = CGRect(x: windowFrame.minX, y: windowFrame.minY + top,
                                    width: windowFrame.width, height: windowFrame.height - top - bottom)
            let railFrame = rail.frame
            let visibleRail = railFrame.intersection(safeBounds)
            let frame = element.frame
            if element.exists, !frame.isEmpty, visibleRail.contains(frame), element.isHittable {
                XCTAssertGreaterThanOrEqual(frame.width, 48, "Tracing choices need a full 48pt touch target.")
                XCTAssertGreaterThanOrEqual(frame.height, 48, "Tracing choices need a full 48pt touch target.")
                return
            }
            let origin = window.coordinate(withNormalizedOffset: .zero)
            if railFrame.minY < safeBounds.minY || railFrame.maxY > safeBounds.maxY {
                let downward = railFrame.minY < safeBounds.minY
                let distance = min(CGFloat(220), max(CGFloat(70), abs(railFrame.midY - safeBounds.midY)))
                let upper = origin.withOffset(CGVector(dx: 8, dy: safeBounds.midY - windowFrame.minY - distance / 2))
                let lower = origin.withOffset(CGVector(dx: 8, dy: safeBounds.midY - windowFrame.minY + distance / 2))
                (downward ? upper : lower).press(forDuration: 0.05, thenDragTo: downward ? lower : upper)
            } else if visibleRail.width >= 96, visibleRail.height >= 48 {
                // Gesture within this observed rail, not on the tracing board.
                // Scroll right to reveal a left-clipped choice and vice versa.
                let left = origin.withOffset(CGVector(dx: visibleRail.minX - windowFrame.minX + visibleRail.width * 0.2,
                                                      dy: visibleRail.midY - windowFrame.minY))
                let right = origin.withOffset(CGVector(dx: visibleRail.minX - windowFrame.minX + visibleRail.width * 0.8,
                                                       dy: visibleRail.midY - windowFrame.minY))
                let towardStart = frame.minX < visibleRail.minX
                (towardStart ? left : right).press(forDuration: 0.05, thenDragTo: towardStart ? right : left)
            }
        }
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Unreachable tracing rail target - \(element.label)"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        let hierarchy = XCTAttachment(string: app.debugDescription)
        hierarchy.name = "Tracing rail accessibility tree - \(railLabel)"
        hierarchy.lifetime = .keepAlways
        add(hierarchy)
        XCTFail("Could not bring \(element.label) fully into \(railLabel). Target: \(element.frame), rail: \(rail.frame).")
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
        let card = app.links["Trail studio"]
        reveal(card)
        card.tap()
        // The family defaults to word practice for older children. These
        // gesture cases explicitly exercise the retained line/shape mode.
        let firstLines = named("First lines")
        XCTAssertTrue(firstLines.waitForExistence(timeout: 15))
        revealInHorizontalRail(firstLines, railLabel: "Trail studio practice modes")
        firstLines.tap()
        // Older ages open an age-specific motif in this mode. Select the
        // retained straight line before checking the same trusted gestures.
        let down = app.buttons["Down"].exists ? app.buttons["Down"] : app.switches["Down"]
        XCTAssertTrue(down.waitForExistence(timeout: 15))
        revealInHorizontalRail(down, railLabel: "Choose what to trace")
        down.tap()
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
        revealInHorizontalRail(cross, railLabel: "Choose what to trace")
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

    // Inspect only rendered pixels from native screenshots, never JS or the
    // canvas/SVG backing state. Pale guide strokes are outside this ink range.
    private func purplePixelCount(_ board: XCUIElement, region: CGRect) throws -> Int {
        let image = board.screenshot().image, side = 256
        let format = UIGraphicsImageRendererFormat(); format.scale = 1; format.opaque = true; format.preferredRange = .standard
        let bounds = CGRect(x: 0, y: 0, width: side, height: side)
        let normalized = UIGraphicsImageRenderer(size: bounds.size, format: format).image { context in
            UIColor.white.setFill(); context.fill(bounds); image.draw(in: bounds)
        }
        let source = try XCTUnwrap(normalized.cgImage)
        var rgba = [UInt8](repeating: 255, count: side * side * 4)
        let rendered = rgba.withUnsafeMutableBytes { bytes -> Bool in
            guard let context = CGContext(data: bytes.baseAddress, width: side, height: side, bitsPerComponent: 8, bytesPerRow: side * 4,
                                          space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue) else { return false }
            context.draw(source, in: bounds); return true
        }
        XCTAssertTrue(rendered)
        var count = 0
        for y in Int(region.minY * CGFloat(side))..<Int(region.maxY * CGFloat(side)) {
            for x in Int(region.minX * CGFloat(side))..<Int(region.maxX * CGFloat(side)) {
                let index = (y * side + x) * 4, r = Int(rgba[index]), g = Int(rgba[index + 1]), b = Int(rgba[index + 2])
                if r < 170 && g < 165 && b > 120 && b - r > 35 && b - g > 35 { count += 1 }
            }
        }
        return count
    }

    func testAgeTenEvidenceFocusedLetterKeepsTrustedInkAcrossViews() throws {
        let age = named("Age 10"); XCTAssertTrue(age.waitForExistence(timeout: 20)); reveal(age); age.tap()
        let card = app.links["Trail studio"]; reveal(card); card.tap()
        let firstBoard = named("Trace letter 1 of 8: e")
        XCTAssertTrue(firstBoard.waitForExistence(timeout: 15), "Phone word practice opens the first enlarged letter of evidence.")
        XCTAssertTrue(named("evidence").exists, "This case must exercise the full eight-letter age-ten word.")
        let whole = app.buttons["Whole word"]; reveal(whole); XCTAssertTrue(whole.isEnabled); whole.tap()
        let wholeBoard = named("Trace the guide with a finger or Pencil"); reveal(wholeBoard, drawingSurface: true)
        let wholeRegion = CGRect(x: 0.58, y: 0.20, width: 0.04, height: 0.06)
        let wholeBefore = try purplePixelCount(wholeBoard, region: wholeRegion)
        let letterI = named("Focus letter 3: i"); reveal(letterI); letterI.tap()
        let board = named("Trace letter 3 of 8: i"); XCTAssertTrue(board.waitForExistence(timeout: 10)); reveal(board, drawingSurface: true)
        XCTAssertGreaterThan(board.frame.width, 220, "The focused letter has a usable phone-sized drawing surface.")
        let focusedRegion = CGRect(x: 0.46, y: 0.42, width: 0.08, height: 0.30)
        let focusedBefore = try purplePixelCount(board, region: focusedRegion)
        // Source i in makeWordStrokes(evidence), projected into its observed
        // focused square: stem .37136→.77565, dot .22435→.32904. Actual pointer
        // delivery and the production trace validator remain unmodified.
        board.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.37136)).press(forDuration: 0.05,
            thenDragTo: board.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.77565)))
        board.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.22435)).press(forDuration: 0.05,
            thenDragTo: board.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.32904)))
        let partial = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH '2 of 11 paths traced'")).firstMatch
        XCTAssertTrue(partial.waitForExistence(timeout: 10), "Both actual finger strokes complete i, not the whole word.")
        let check = app.buttons["Check tracing"]; XCTAssertTrue(check.isEnabled)
        let focusedAfter = try purplePixelCount(board, region: focusedRegion)
        XCTAssertGreaterThan(focusedAfter, focusedBefore + 80, "A long, visible ink stem spans the enlarged letter surface.")
        let focusedScreenshot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        focusedScreenshot.name = "Age 10 evidence — trusted ink on enlarged i"; focusedScreenshot.lifetime = .keepAlways; add(focusedScreenshot)
        let letterD = named("Focus letter 4: d"); reveal(letterD); letterD.tap()
        XCTAssertTrue(named("Trace letter 4 of 8: d").waitForExistence(timeout: 10))
        reveal(whole); whole.tap(); reveal(wholeBoard, drawingSurface: true)
        XCTAssertGreaterThan(try purplePixelCount(wholeBoard, region: wholeRegion), wholeBefore + 4,
                             "The same ink appears in i's canonical whole-word position.")
        let wholeScreenshot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        wholeScreenshot.name = "Age 10 evidence — focused ink retained in whole word"; wholeScreenshot.lifetime = .keepAlways; add(wholeScreenshot)
        reveal(check); check.tap(); XCTAssertTrue(check.isEnabled, "Two of eleven paths must never pass the whole-word scorer.")
        XCTAssertFalse(named("evidence, practiced").exists, "Partial letter work cannot earn whole-word practice credit.")
        reveal(letterI); letterI.tap(); reveal(board, drawingSurface: true)
        let restored = try purplePixelCount(board, region: focusedRegion)
        XCTAssertGreaterThanOrEqual(restored, Int(Double(focusedAfter) * 0.95), "Switching letters and Whole word preserves the enlarged ink.")
        XCTAssertTrue(partial.exists, "The production validator retains both completed letter strokes after view changes.")
    }
}
