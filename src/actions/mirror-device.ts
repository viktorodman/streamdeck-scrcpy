import {
	action,
	type KeyAction,
	type KeyDownEvent,
	SingletonAction,
	type WillAppearEvent,
	type WillDisappearEvent
} from "@elgato/streamdeck";
import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const SCRCPY_PATH = "/opt/homebrew/bin/scrcpy";
const PATH_PREPEND = "/opt/homebrew/bin";
const POLL_INTERVAL_MS = 3000;

type MirrorSettings = {
	deviceSerial?: string;
};

@action({ UUID: "com.viktorodman.scrcpy.mirror-device" })
export class MirrorDevice extends SingletonAction<MirrorSettings> {
	private readonly pollers = new Map<string, NodeJS.Timeout>();

	override async onWillAppear(ev: WillAppearEvent<MirrorSettings>): Promise<void> {
		if (!ev.action.isKey()) return;
		const serial = ev.payload.settings?.deviceSerial;
		if (!serial) return;

		const keyAction = ev.action;
		await this.refreshState(keyAction, serial);

		const timer = setInterval(() => {
			void this.refreshState(keyAction, serial);
		}, POLL_INTERVAL_MS);
		this.pollers.set(ev.action.id, timer);
	}

	override onWillDisappear(ev: WillDisappearEvent<MirrorSettings>): void {
		const timer = this.pollers.get(ev.action.id);
		if (timer) clearInterval(timer);
		this.pollers.delete(ev.action.id);
	}

	override async onKeyDown(ev: KeyDownEvent<MirrorSettings>): Promise<void> {
		const serial = ev.payload.settings?.deviceSerial;
		if (!serial) {
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
		const child = spawn(SCRCPY_PATH, ["-s", serial], {
			detached: true,
			stdio: "ignore",
			env: { ...process.env, PATH: `${PATH_PREPEND}:${process.env.PATH ?? ""}` }
		});
		child.unref();
	}
}

function escapeShell(s: string): string {
	return s.replace(/[^A-Za-z0-9_-]/g, "");
}
