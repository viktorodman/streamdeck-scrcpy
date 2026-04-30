# streamdeck-scrcpy

Stream Deck plugin: toggle [scrcpy](https://github.com/Genymobile/scrcpy) mirroring of an Android device with a state-aware button. The icon reflects the actual scrcpy process state — even if you close the scrcpy window manually, the button updates within a few seconds.

## Install (end users)

1. Make sure you have `scrcpy` and `adb`: `brew install scrcpy android-platform-tools`
2. Download `com.viktorodman.scrcpy.streamDeckPlugin` from the [latest release](https://github.com/viktorodman/streamdeck-scrcpy/releases).
3. Double-click the file. The Stream Deck app will prompt you to install — accept.
4. In the Stream Deck app, drop the **scrcpy → Mirror Device** action onto a button.
5. In the property inspector, paste your device serial (find it with `adb devices`).
6. Press the button. The icon flips between grey phone (off) and green phone-with-waves (on).

## Develop

Requires Node.js 20+ and the Elgato CLI (`npm i -g @elgato/cli`).

```sh
npm install
npm run build

streamdeck dev    # one-time, enables developer mode
streamdeck link com.viktorodman.scrcpy.sdPlugin

npm run watch    # rebuild + restart the plugin on save
```

Logs land in `com.viktorodman.scrcpy.sdPlugin/logs/`.

## Package a release

```sh
npm run pack
```

Produces `com.viktorodman.scrcpy.streamDeckPlugin` in the repo root — attach it to a GitHub release.

## Regenerate icons

```sh
swift scripts/make-icons.swift
```

Edit the SF Symbol names or tints in `scripts/make-icons.swift` to customize.
