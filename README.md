# streamdeck-scrcpy

Stream Deck plugin: toggle [scrcpy](https://github.com/Genymobile/scrcpy) mirroring of an Android device with a state-aware button. The icon reflects the actual scrcpy process state — even if the user closes the scrcpy window manually, the button updates.

## Prerequisites

- macOS, Stream Deck app 6.5+, Node.js 20+
- `scrcpy` and `adb` installed (`brew install scrcpy android-platform-tools`)
- Phone connected via USB with USB debugging authorized

## Develop

```sh
npm install
npm run build

# enable Stream Deck dev mode (one-time)
streamdeck dev

# install this plugin into Stream Deck for development
streamdeck link com.viktorodman.scrcpy.sdPlugin

# rebuild on save and reload the plugin
npm run watch
```

To use: drop the **Mirror Device** action onto a Stream Deck button and set the device serial in the property inspector. Find your serial with `adb devices`.

## Package for distribution

```sh
streamdeck pack com.viktorodman.scrcpy.sdPlugin
```

Produces `com.viktorodman.scrcpy.streamDeckPlugin` — recipients can double-click to install.

## Regenerate icons

```sh
swift scripts/make-icons.swift
```

Edit the SF Symbol names or tints in `scripts/make-icons.swift` to customize.
