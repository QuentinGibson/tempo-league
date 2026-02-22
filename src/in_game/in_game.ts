import { OWGames, OWHotkeys } from "@overwolf/overwolf-api-ts";

import { AppWindow } from "../AppWindow";
import { kHotkeys, kWindowNames } from "../consts";

import WindowState = overwolf.windows.WindowStateEx;

// The window displayed in-game while a game is running.
// It listens to all info events and to the game events listed in the consts.ts file
// and writes them to the relevant log using <pre> tags.
// The window also sets up Ctrl+F as the minimize/restore hotkey.
// Like the background window, it also implements the Singleton design pattern.
class InGame extends AppWindow {
	private static _instance: InGame;

	// HUD elements
	private _hudWaiting: HTMLElement;
	private _hudData: HTMLElement;
	private _hudBpmValue: HTMLElement;
	private _hudAsValue: HTMLElement;

	private constructor() {
		super(kWindowNames.inGame);

		this._hudWaiting = document.getElementById("hudWaiting");
		this._hudData = document.getElementById("hudData");
		this._hudBpmValue = document.getElementById("hudBpmValue");
		this._hudAsValue = document.getElementById("hudAsValue");

		this.setToggleHotkeyBehavior();
		this.setToggleHotkeyText();
	}

	public static instance() {
		if (!InGame._instance) {
			InGame._instance = new InGame();
		}

		return InGame._instance;
	}

	public async run() {
		// Check for existing data (background may have already written it)
		const existing = localStorage.getItem("tempo_champion");
		if (existing) {
			this.updateHud(existing);
		}

		// Background controller owns the game event listener and writes to localStorage.
		// in_game window just reads from it for the HUD display.
		window.addEventListener("storage", (e: StorageEvent) => {
			if (e.key === "tempo_champion") {
				if (e.newValue) {
					this.updateHud(e.newValue);
				} else {
					this._hudData.classList.remove("visible");
					this._hudWaiting.classList.remove("hidden");
				}
			}
		});
	}

	private updateHud(json: string) {
		try {
			const data = JSON.parse(json);
			if (data.attackSpeed !== undefined) {
				const bpm = Math.round(data.attackSpeed * 60);
				this._hudBpmValue.textContent = String(bpm);
				this._hudAsValue.textContent = data.attackSpeed.toFixed(3);
				this._hudWaiting.classList.add("hidden");
				this._hudData.classList.add("visible");
			}
		} catch (err) {
			console.error("Failed to parse champion data:", err);
		}
	}

	// Displays the toggle minimize/restore hotkey in the window header
	private async setToggleHotkeyText() {
		const gameClassId = await this.getCurrentGameClassId();
		const hotkeyText = await OWHotkeys.getHotkeyText(
			kHotkeys.toggle,
			gameClassId,
		);
		const hotkeyElem = document.getElementById("hotkey");
		hotkeyElem.textContent = hotkeyText;
	}

	// Sets toggleInGameWindow as the behavior for the Ctrl+F hotkey
	private async setToggleHotkeyBehavior() {
		const toggleInGameWindow = async (
			hotkeyResult: overwolf.settings.hotkeys.OnPressedEvent,
		): Promise<void> => {
			console.log(`pressed hotkey for ${hotkeyResult.name}`);
			const inGameState = await this.getWindowState();

			if (
				inGameState.window_state === WindowState.NORMAL ||
				inGameState.window_state === WindowState.MAXIMIZED
			) {
				this.currWindow.minimize();
			} else if (
				inGameState.window_state === WindowState.MINIMIZED ||
				inGameState.window_state === WindowState.CLOSED
			) {
				this.currWindow.restore();
			}
		};

		OWHotkeys.onHotkeyDown(kHotkeys.toggle, toggleInGameWindow);
	}

	private async getCurrentGameClassId(): Promise<number | null> {
		const info = await OWGames.getRunningGameInfo();

		return info?.isRunning && info.classId ? info.classId : null;
	}
}

InGame.instance().run();
