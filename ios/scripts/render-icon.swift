// Reproduce the existing Doodle Fun SVG mark as an opaque App Store icon.
// Run from the repository root: swift ios/scripts/render-icon.swift
import AppKit
import ImageIO
import UniformTypeIdentifiers
let size = 1024
let cg = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: size * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
cg.setFillColor(NSColor(srgbRed: 87/255, green: 84/255, blue: 214/255, alpha: 1).cgColor)
cg.fill(CGRect(x: 0, y: 0, width: size, height: size))
cg.translateBy(x: 0, y: 1024)
cg.scaleBy(x: 16, y: -16)
cg.setStrokeColor(NSColor.white.cgColor)
cg.setLineWidth(7)
cg.setLineCap(.round)
cg.move(to: CGPoint(x: 42, y: 13))
cg.addLine(to: CGPoint(x: 42, y: 48))
cg.addLine(to: CGPoint(x: 29, y: 48))
cg.addCurve(to: CGPoint(x: 29, y: 21), control1: CGPoint(x: 10, y: 48), control2: CGPoint(x: 10, y: 21))
cg.addLine(to: CGPoint(x: 42, y: 21))
cg.strokePath()
cg.setFillColor(NSColor(srgbRed: 1, green: 208/255, blue: 102/255, alpha: 1).cgColor)
cg.fillEllipse(in: CGRect(x: 45, y: 44, width: 10, height: 10))
let output = URL(fileURLWithPath: "ios/DoodleFun/Assets.xcassets/AppIcon.appiconset/AppIcon.png")
let destination = CGImageDestinationCreateWithURL(output as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(destination, cg.makeImage()!, nil)
precondition(CGImageDestinationFinalize(destination))
