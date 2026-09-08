import Foundation
import ImageIO
import UIKit
import UniformTypeIdentifiers

enum NativeBridgePolicy {
    static let maximumImageBytes = 10 * 1024 * 1024

    static func allows(_ candidate: URL?, document: URL) -> Bool {
        guard let candidate, candidate.isFileURL,
              candidate.host == nil || candidate.host == "" || candidate.host == "localhost",
              candidate.query == nil else { return false }
        return candidate.standardizedFileURL.resolvingSymlinksInPath().path == document.standardizedFileURL.resolvingSymlinksInPath().path
    }

    static func route(_ value: Any?) -> String? {
        guard let hash = value as? String,
              hash.range(of: "^#[a-z0-9-]{0,60}$", options: .regularExpression) != nil else { return nil }
        return hash
    }

    static func externalURL(_ value: Any?) -> URL? {
        let destinations: Set<String> = [
            "https://kartikkp.github.io/Doodle-fun/privacy.html",
            "https://kartikkp.github.io/Doodle-fun/support.html",
            "https://github.com/kartikkp/Doodle-fun/issues",
            "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
        ]
        guard let value = value as? String, destinations.contains(value) else { return nil }
        return URL(string: value)
    }

    struct ParentChallenge {
        let left: Int
        let right: Int

        init(left: Int = Int.random(in: 12...19), right: Int = Int.random(in: 12...19)) {
            self.left = left
            self.right = right
        }

        var prompt: String { "To continue, ask a grown-up to solve: \(left) × \(right) = ?" }

        func accepts(_ answer: String) -> Bool {
            let value = answer.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !value.isEmpty, value.utf8.count <= 4,
                  value.utf8.allSatisfy({ (48...57).contains($0) }) else { return false }
            return Int(value) == left * right
        }
    }

    struct ShareImage {
        let png: Data
        let filename: String
    }

    static func shareImage(_ body: [String: Any]) -> ShareImage? {
        let prefix = "data:image/png;base64,"
        guard let dataURL = body["dataURL"] as? String,
              dataURL.utf8.count <= prefix.count + ((maximumImageBytes + 2) / 3) * 4,
              dataURL.hasPrefix(prefix),
              let data = Data(base64Encoded: String(dataURL.dropFirst(prefix.count))),
              data.count <= maximumImageBytes,
              data.starts(with: [137, 80, 78, 71, 13, 10, 26, 10]),
              let source = CGImageSourceCreateWithData(data as CFData, nil),
              CGImageSourceGetType(source) as String? == UTType.png.identifier,
              CGImageSourceGetCount(source) == 1,
              let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
              let width = properties[kCGImagePropertyPixelWidth] as? Int,
              let height = properties[kCGImagePropertyPixelHeight] as? Int,
              (1...4096).contains(width), (1...4096).contains(height),
              width * height <= 16_777_216,
              let image = CGImageSourceCreateImageAtIndex(source, 0, nil),
              let png = UIImage(cgImage: image).pngData() else { return nil }
        let requested = (body["name"] as? String ?? "my-doodle").replacingOccurrences(of: ".png", with: "", options: [.caseInsensitive])
        let safe = String(requested.unicodeScalars.filter { CharacterSet.alphanumerics.contains($0) || " -_".unicodeScalars.contains($0) }.prefix(80))
            .trimmingCharacters(in: .whitespaces)
        return ShareImage(png: png, filename: (safe.isEmpty ? "my-doodle" : safe) + ".png")
    }
}
