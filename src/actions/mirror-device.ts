import streamDeck, {
	action,
	type DidReceiveSettingsEvent,
	type KeyAction,
	type KeyDownEvent,
	SingletonAction,
	type WillAppearEvent,
	type WillDisappearEvent
} from "@elgato/streamdeck";
import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// Common Homebrew bin dirs on Apple Silicon and Intel Macs
const HOMEBREW_BIN_DIRS = ["/opt/homebrew/bin", "/usr/local/bin"];
const POLL_INTERVAL_MS = 3000;

type MirrorSettings = {
	deviceSerial?: string;
};

@action({ UUID: "com.viktorodman.scrcpy.mirror-device" })
export class MirrorDevice extends SingletonAction<MirrorSettings> {
	private readonly pollers = new Map<string, NodeJS.Timeout>();

	override async onWillAppear(ev: WillAppearEvent<MirrorSettings>): Promise<void> {
		streamDeck.logger.info(`willAppear id=${ev.action.id} settings=${JSON.stringify(ev.payload.settings)}`);
		if (!ev.action.isKey()) return;
		this.restartPolling(ev.action, ev.payload.settings?.deviceSerial);
	}

	override onWillDisappear(ev: WillDisappearEvent<MirrorSettings>): void {
		this.stopPolling(ev.action.id);
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<MirrorSettings>): Promise<void> {
		streamDeck.logger.info(`didReceiveSettings id=${ev.action.id} settings=${JSON.stringify(ev.payload.settings)}`);
		if (!ev.action.isKey()) return;
		this.restartPolling(ev.action, ev.payload.settings?.deviceSerial);
	}

	override async onKeyDown(ev: KeyDownEvent<MirrorSettings>): Promise<void> {
		streamDeck.logger.info(`keyDown id=${ev.action.id} settings=${JSON.stringify(ev.payload.settings)}`);
		const serial = ev.payload.settings?.deviceSerial;
		if (!serial) {
			streamDeck.logger.warn("keyDown: no serial configured");
			await ev.action.showAlert();
			return;
		}

		const running = await this.isRunning(serial);
		if (running) {
			await this.kill(serial);
		} else {
			this.start(serial);
		}

		setTimeout(() => void this.refreshState(ev.action, serial), 500);
	}

	private restartPolling(action: KeyAction<MirrorSettings>, serial: string | undefined): void {
		this.stopPolling(action.id);
		if (!serial) return;

		void this.refreshState(action, serial);
		const timer = setInterval(() => void this.refreshState(action, serial), POLL_INTERVAL_MS);
		this.pollers.set(action.id, timer);
	}

	private stopPolling(actionId: string): void {
		const timer = this.pollers.get(actionId);
		if (timer) clearInterval(timer);
		this.pollers.delete(actionId);
	}

	private async refreshState(action: KeyAction<MirrorSettings>, serial: string): Promise<void> {
		const running = await this.isRunning(serial);
		await action.setState(running ? 1 : 0);
	}

	private async isRunning(serial: string): Promise<boolean> {
		try {
			await execAsync(`pgrep -f 'scrcpy.*${escapeShell(serial)}'`);
			return true;
		} catch {
			return false;
		}
	}

	private async kill(serial: string): Promise<void> {
		try {
			await execAsync(`pkill -f 'scrcpy.*${escapeShell(serial)}'`);
		} catch {
			// pkill returns non-zero when nothing matched
		}
	}

	private start(serial: string): void {
		const augmentedPath = [...HOMEBREW_BIN_DIRS, process.env.PATH ?? ""].filter(Boolean).join(":");
		const child = spawn("scrcpy", ["-s", serial], {
			detached: true,
			stdio: "ignore",
			env: { ...process.env, PATH: augmentedPath }
		});
		child.on("error", (err) => streamDeck.logger.error(`scrcpy spawn error: ${err.message}`));
		child.unref();
	}
}

function escapeShell(s: string): string {
	return s.replace(/[^A-Za-z0-9_-]/g, "");
}
