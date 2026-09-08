import XCTest
import UIKit

/// Exercises the shipping web canvas through real XCUI touches. No JavaScript,
/// backing-store access, or production test hooks are used by this class.
final class DrawingRecoveryUITests: XCTestCase {
    private var app: XCUIApplication!
    private let paperLabel = "Drawing paper. Draw using your finger, Apple Pencil, or mouse."

    override func setUpWithError() throws {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        app = XCUIApplication()
        app.launchArguments = ["--reset-test-data"]
        app.launch()
        openDrawing()
    }

    override func tearDownWithError() throws {
        if (testRun?.failureCount ?? 0) > 0 {
            capture("Drawing failure screen")
            let tree = XCTAttachment(string: app.debugDescription)
            tree.name = "Drawing failure accessibility tree"
            tree.lifetime = .keepAlways
            add(tree)
        }
        XCUIDevice.shared.orientation = .portrait
        app.terminate()
    }

    private var paper: XCUIElement {
        app.webViews.firstMatch.descendants(matching: .any)
            .matching(NSPredicate(format: "label == %@", paperLabel)).firstMatch
    }

    private func openDrawing() {
        // iOS 26 exposes both an aggregate card link and its title link. The
        // observed title frame is the reliable touch target for this card.
        let card = app.links.matching(NSPredicate(format: "label == 'Doodle studio'")).firstMatch
        XCTAssertTrue(card.waitForExistence(timeout: 30), "The bundled activity catalog should open.")
        let web = app.webViews.firstMatch
        waitFor("The activity title should have a visible layout frame.") { card.frame.width > 0 && card.frame.height > 0 }
        for _ in 0..<3 {
            if web.frame.insetBy(dx: 12, dy: 60).contains(card.frame) { break }
            // Scroll only when the observed title is outside the usable viewport.
            if card.frame.midY > web.frame.midY { web.swipeUp() } else { web.swipeDown() }
        }
        var previousFrame = CGRect.zero
        var unchangedSince: Date?
        waitFor("The exact activity title should settle in a hittable position.") {
            let frame = card.frame
            guard card.isHittable, frame.width > 0, frame.height > 0,
                  web.frame.insetBy(dx: 12, dy: 60).contains(frame) else {
                unchangedSince = nil
                return false
            }
            if abs(frame.minX - previousFrame.minX) > 1 || abs(frame.minY - previousFrame.minY) > 1 ||
                abs(frame.width - previousFrame.width) > 1 || abs(frame.height - previousFrame.height) > 1 {
                previousFrame = frame
                unchangedSince = Date()
                return false
            }
            if unchangedSince == nil { unchangedSince = Date() }
            return Date().timeIntervalSince(unchangedSince!) >= 0.35
        }
        card.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        XCTAssertTrue(app.buttons["Save"].waitForExistence(timeout: 15))
        XCTAssertTrue(paper.waitForExistence(timeout: 15), "The visible drawing canvas must be accessible by its label.")
        waitFor("The drawing paper should be fully visible after navigation.") { self.paperFrameIsVisible() }
    }

    private func paperFrameIsVisible() -> Bool {
        guard paper.exists else { return false }
        let frame = paper.frame
        return frame.width > 120 && abs(frame.width - frame.height) <= 2 &&
            app.webViews.firstMatch.frame.insetBy(dx: -2, dy: -2).contains(frame)
    }

    private func selectSupply(_ label: String) {
        // aria-pressed buttons are exposed as Switch elements in native WebKit.
        let control = app.webViews.firstMatch.descendants(matching: .any)
            .matching(NSPredicate(format: "label == %@", label)).firstMatch
        XCTAssertTrue(control.waitForExistence(timeout: 10), "The \(label) art supply should be available.")
        XCTAssertTrue(control.isHittable)
        control.tap()
    }

    private func waitFor(_ label: String, timeout: TimeInterval = 10, _ condition: @escaping () -> Bool) {
        let expectation = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in condition() }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: timeout), .completed, label)
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func snapshot(_ name: String) throws -> InkSnapshot {
        let element = paper
        XCTAssertTrue(element.exists)
        // Native WebKit exposes canvas as a non-activatable AX element, so
        // isHittable can be false even when its paper is fully visible. Its
        // observed frame locates touches; subsequent ink changes prove input.
        waitFor("The visible paper should finish laying out before its screenshot.") { self.paperFrameIsVisible() }
        let frame = element.frame
        XCTAssertGreaterThan(frame.width, 120, "Drawing paper should remain usable in this orientation.")
        XCTAssertEqual(frame.width, frame.height, accuracy: 2, "The observed canvas must be square before comparing artwork.")
        XCTAssertTrue(app.webViews.firstMatch.frame.insetBy(dx: -2, dy: -2).contains(frame), "Capture the visible paper, without clipping.")
        let screenshot = element.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "Paper — \(name)"
        attachment.lifetime = .keepAlways
        add(attachment)
        return try InkSnapshot(image: screenshot.image)
    }

    private func drawMark() {
        selectSupply("Pen")
        selectSupply("Coral")
        let brush = app.webViews.firstMatch.descendants(matching: .any)
            .matching(NSPredicate(format: "label BEGINSWITH 'Large brush'")).firstMatch
        XCTAssertTrue(brush.exists)
        brush.tap()
        // Coordinates are relative to the canvas's observed accessibility frame,
        // never to guessed locations within the full web view.
        let start = paper.coordinate(withNormalizedOffset: CGVector(dx: 0.23, dy: 0.28))
        let end = paper.coordinate(withNormalizedOffset: CGVector(dx: 0.72, dy: 0.64))
        start.press(forDuration: 0.05, thenDragTo: end)
        waitFor("A finger stroke should create an undoable action.") { self.app.buttons["Undo last action"].isEnabled }
    }

    private func expectSameArtwork(_ expected: InkSnapshot, _ actual: InkSnapshot, _ message: String, file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertGreaterThan(expected.inkCount, 50, "Reference must contain real ink.", file: file, line: line)
        XCTAssertGreaterThan(actual.inkCount, 50, message, file: file, line: line)
        // A resize changes raster sampling. Compare the ink geometry at a common
        // resolution: at least 97% of both masks must have ink within 2 pixels
        // (0.8% of the paper), and total ink area may differ by no more than 20%.
        // This catches missing/moved strokes without requiring PNG-byte equality.
        XCTAssertGreaterThanOrEqual(expected.coverage(by: actual), 0.97, message, file: file, line: line)
        XCTAssertGreaterThanOrEqual(actual.coverage(by: expected), 0.97, message, file: file, line: line)
        let ratio = Double(actual.inkCount) / Double(max(1, expected.inkCount))
        XCTAssertGreaterThanOrEqual(ratio, 0.8, message, file: file, line: line)
        XCTAssertLessThanOrEqual(ratio, 1.2, message, file: file, line: line)
    }

    func testFingerStrokeUndoRedoRotationAndRelaunch() throws {
        let blank = try snapshot("fresh paper")
        XCTAssertLessThan(blank.inkCount, 20)
        drawMark()
        let drawn = try snapshot("finger stroke")
        XCTAssertGreaterThan(drawn.coralCount, 50, "The touch must visibly paint the selected color.")

        app.buttons["Undo last action"].tap()
        let undone = try snapshot("undo stroke")
        XCTAssertLessThan(undone.inkCount, 20, "Undo should leave the original blank paper.")
        XCTAssertTrue(app.buttons["Redo last action"].isEnabled)
        app.buttons["Redo last action"].tap()
        expectSameArtwork(drawn, try snapshot("redo stroke"), "Redo must restore the actual mark.")

        XCUIDevice.shared.orientation = .landscapeLeft
        waitFor("The app should rotate to landscape.") { self.app.frame.width > self.app.frame.height }
        expectSameArtwork(drawn, try snapshot("landscape artwork"), "Artwork geometry must survive rotation.")
        capture("Drawing supplies in landscape")
        XCUIDevice.shared.orientation = .portrait
        waitFor("The app should return to portrait.") { self.app.frame.height > self.app.frame.width }
        expectSameArtwork(drawn, try snapshot("portrait after rotation"), "Rotation back must preserve the mark.")

        let saved = app.descendants(matching: .any).matching(NSPredicate(format: "label == 'Draft saved on this device'")).firstMatch
        XCTAssertTrue(saved.waitForExistence(timeout: 10), "Wait for the real draft-save acknowledgement before terminating.")
        app.terminate()
        app.launchArguments = []
        app.launch()
        openDrawing()
        let restored = app.descendants(matching: .any).matching(NSPredicate(format: "label == 'Your last picture is ready'")).firstMatch
        XCTAssertTrue(restored.waitForExistence(timeout: 10))
        expectSameArtwork(drawn, try snapshot("restored after relaunch"), "Relaunch should visibly restore the saved artwork.")
    }

    func testNewPictureCancelClearUndoAndRedo() throws {
        drawMark()
        let original = try snapshot("before new picture")
        app.buttons["Start a new drawing"].tap()
        XCTAssertTrue(app.buttons["Keep drawing"].waitForExistence(timeout: 10))
        capture("New picture confirmation")
        app.buttons["Keep drawing"].tap()
        expectSameArtwork(original, try snapshot("cancel new picture"), "Cancel must keep the picture.")

        app.buttons["Start a new drawing"].tap()
        app.buttons["Start fresh"].tap()
        XCTAssertLessThan(try snapshot("cleared picture").inkCount, 20, "Start fresh must visibly clear the paper.")
        XCTAssertTrue(app.buttons["Undo last action"].isEnabled)
        app.buttons["Undo last action"].tap()
        expectSameArtwork(original, try snapshot("undo clear"), "Undo must recover the picture removed by Start fresh.")
        app.buttons["Redo last action"].tap()
        XCTAssertLessThan(try snapshot("redo clear").inkCount, 20)
    }

    func testAllNineColoringPagesRenderAcceptFillAndUndo() throws {
        let names = ["Sunshine", "Rainbow", "House", "Butterfly", "Rocket", "Cat", "Flower", "Fish", "Dino"]
        var fingerprints = Set<[Bool]>()
        for (index, name) in names.enumerated() {
            app.buttons["Choose a coloring page"].tap()
            let choice = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Color \(name) ")).firstMatch
            XCTAssertTrue(choice.waitForExistence(timeout: 10), "\(name) should be offered in the page picker.")
            choice.tap()
            if index > 0 {
                XCTAssertTrue(app.buttons["Start fresh"].waitForExistence(timeout: 10))
                app.buttons["Start fresh"].tap()
            }
            XCTAssertTrue(app.buttons["Close coloring pages"].waitForNonExistence(timeout: 10))
            let outline = try snapshot("\(name) line art")
            XCTAssertGreaterThan(outline.inkCount, 600, "\(name) must render substantial line art.")
            XCTAssertLessThan(outline.inkCount, 32_000, "\(name) must leave usable space to color.")
            XCTAssertTrue(fingerprints.insert(outline.ink).inserted, "\(name) must render a distinct picture.")
            XCTAssertLessThan(outline.coralCount, 20)
            selectSupply("Fill")
            selectSupply("Coral")
            paper.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
            let colored = try snapshot("\(name) after fill touch")
            XCTAssertGreaterThan(colored.coralCount, 20, "Tapping \(name) should visibly apply the selected paint.")
            app.buttons["Undo last action"].tap()
            let recovered = try snapshot("\(name) undo fill")
            XCTAssertLessThan(recovered.coralCount, 20, "Undo should remove the applied color.")
            expectSameArtwork(outline, recovered, "Undo should restore \(name)'s line art.")
        }
        XCTAssertEqual(fingerprints.count, 9)
    }

    private struct InkSnapshot {
        static let side = 256
        let ink: [Bool]
        let inkCount: Int
        let coralCount: Int

        init(image: UIImage) throws {
            // XCUI landscape PNGs can carry EXIF rotation (orientation 8).
            // UIImage drawing applies that orientation; raw cgImage does not.
            let bounds = CGRect(x: 0, y: 0, width: Self.side, height: Self.side)
            let format = UIGraphicsImageRendererFormat()
            format.scale = 1
            format.opaque = true
            format.preferredRange = .standard
            let upright = UIGraphicsImageRenderer(size: bounds.size, format: format).image { context in
                UIColor.white.setFill()
                context.fill(bounds)
                image.draw(in: bounds)
            }
            let source = try XCTUnwrap(upright.cgImage)
            var rgba = [UInt8](repeating: 255, count: Self.side * Self.side * 4)
            let rendered = rgba.withUnsafeMutableBytes { buffer -> Bool in
                guard let context = CGContext(data: buffer.baseAddress, width: Self.side, height: Self.side,
                                              bitsPerComponent: 8, bytesPerRow: Self.side * 4,
                                              space: CGColorSpaceCreateDeviceRGB(),
                                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue) else { return false }
                context.interpolationQuality = .high
                context.draw(source, in: CGRect(x: 0, y: 0, width: Self.side, height: Self.side))
                return true
            }
            XCTAssertTrue(rendered)
            var mask = [Bool](repeating: false, count: Self.side * Self.side)
            var coral = 0
            // Ignore the outer 4% where the rounded paper edge/shadow may appear.
            for y in 10..<(Self.side - 10) {
                for x in 10..<(Self.side - 10) {
                    let index = y * Self.side + x, byte = index * 4
                    let r = rgba[byte], g = rgba[byte + 1], b = rgba[byte + 2]
                    mask[index] = min(r, g, b) < 220
                    if r > 175 && g < 175 && b < 195 && Int(r) - Int(g) > 45 { coral += 1 }
                }
            }
            ink = mask
            inkCount = mask.reduce(0) { $0 + ($1 ? 1 : 0) }
            coralCount = coral
        }

        func coverage(by other: InkSnapshot) -> Double {
            var matched = 0
            for index in ink.indices where ink[index] {
                let x = index % Self.side, y = index / Self.side
                var found = false
                for dy in -2...2 {
                    for dx in -2...2 where !found {
                        let nx = x + dx, ny = y + dy
                        if (0..<Self.side).contains(nx), (0..<Self.side).contains(ny), other.ink[ny * Self.side + nx] { found = true }
                    }
                }
                if found { matched += 1 }
            }
            return Double(matched) / Double(max(1, inkCount))
        }
    }
}
