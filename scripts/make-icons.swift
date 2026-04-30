import Cocoa

struct IconSpec {
	let path: String
	let size: Int
	let symbolPointSize: CGFloat
	let symbolName: String
	let tint: NSColor
}

let pluginRoot = "com.viktorodman.scrcpy.sdPlugin"

let phoneOff = "iphone"
let phoneOn = "iphone.gen3.radiowaves.left.and.right"
let off = NSColor(white: 0.55, alpha: 1.0)
let on = NSColor(red: 0.30, green: 0.85, blue: 0.45, alpha: 1.0)

let icons: [IconSpec] = [
	// Action key images (rendered on the Stream Deck button itself)
	IconSpec(path: "\(pluginRoot)/imgs/actions/mirror-device/key-off.png", size: 72, symbolPointSize: 50, symbolName: phoneOff, tint: off),
	IconSpec(path: "\(pluginRoot)/imgs/actions/mirror-device/key-off@2x.png", size: 144, symbolPointSize: 100, symbolName: phoneOff, tint: off),
	IconSpec(path: "\(pluginRoot)/imgs/actions/mirror-device/key-on.png", size: 72, symbolPointSize: 50, symbolName: phoneOn, tint: on),
	IconSpec(path: "\(pluginRoot)/imgs/actions/mirror-device/key-on@2x.png", size: 144, symbolPointSize: 100, symbolName: phoneOn, tint: on),

	// Action icon shown in the Stream Deck UI action list
	IconSpec(path: "\(pluginRoot)/imgs/actions/mirror-device/icon.png", size: 20, symbolPointSize: 16, symbolName: phoneOff, tint: NSColor.white),
	IconSpec(path: "\(pluginRoot)/imgs/actions/mirror-device/icon@2x.png", size: 40, symbolPointSize: 32, symbolName: phoneOff, tint: NSColor.white),

	// Plugin / category icon
	IconSpec(path: "\(pluginRoot)/imgs/plugin/category-icon.png", size: 28, symbolPointSize: 22, symbolName: phoneOn, tint: NSColor.white),
	IconSpec(path: "\(pluginRoot)/imgs/plugin/category-icon@2x.png", size: 56, symbolPointSize: 44, symbolName: phoneOn, tint: NSColor.white),

	// Marketplace square (288x288)
	IconSpec(path: "\(pluginRoot)/imgs/plugin/marketplace.png", size: 288, symbolPointSize: 200, symbolName: phoneOn, tint: on)
]

let fm = FileManager.default

for spec in icons {
	let dir = (spec.path as NSString).deletingLastPathComponent
	try? fm.createDirectory(atPath: dir, withIntermediateDirectories: true)

	let canvasSize = NSSize(width: spec.size, height: spec.size)
	let config = NSImage.SymbolConfiguration(pointSize: spec.symbolPointSize, weight: .regular)

	guard let baseSymbol = NSImage(systemSymbolName: spec.symbolName, accessibilityDescription: nil)?
		.withSymbolConfiguration(config) else {
		print("Symbol failed: \(spec.symbolName)")
		continue
	}
	baseSymbol.isTemplate = true

	let canvas = NSImage(size: canvasSize)
	canvas.lockFocus()

	NSColor.clear.setFill()
	NSBezierPath(rect: NSRect(origin: .zero, size: canvasSize)).fill()

	let symSize = baseSymbol.size
	let symRect = NSRect(
		x: (canvasSize.width - symSize.width) / 2,
		y: (canvasSize.height - symSize.height) / 2,
		width: symSize.width,
		height: symSize.height
	)

	let tinted = NSImage(size: symSize)
	tinted.lockFocus()
	baseSymbol.draw(at: .zero, from: NSRect(origin: .zero, size: symSize), operation: .sourceOver, fraction: 1.0)
	spec.tint.set()
	NSRect(origin: .zero, size: symSize).fill(using: .sourceIn)
	tinted.unlockFocus()
	tinted.draw(in: symRect, from: .zero, operation: .sourceOver, fraction: 1.0)

	canvas.unlockFocus()

	guard let tiff = canvas.tiffRepresentation,
		let bitmap = NSBitmapImageRep(data: tiff),
		let png = bitmap.representation(using: .png, properties: [:]) else {
		print("Encode failed: \(spec.path)")
		continue
	}

	try? png.write(to: URL(fileURLWithPath: spec.path))
	print("Wrote \(spec.path)")
}
