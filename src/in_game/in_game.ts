import { OWGames, OWGamesEvents, OWHotkeys } from "@overwolf/overwolf-api-ts";

import { AppWindow } from "../AppWindow";
import { kGamesFeatures, kHotkeys, kWindowNames } from "../consts";

import WindowState = overwolf.windows.WindowStateEx;

// The window displayed in-game while a game is running.
// It listens to all info events and to the game events listed in the consts.ts file
// and writes them to the relevant log using <pre> tags.
// The window also sets up Ctrl+F as the minimize/restore hotkey.
// Like the background window, it also implements the Singleton design pattern.
class InGame extends AppWindow {
	private static _instance: InGame;
	private _gameEventsListener: OWGamesEvents;
	private _eventsLog: HTMLElement;
	private _infoLog: HTMLElement;

	private constructor() {
		super(kWindowNames.inGame);

		this._eventsLog = document.getElementById("eventsLog");
		this._infoLog = document.getElementById("infoLog");

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
		const gameClassId = await this.getCurrentGameClassId();

		const gameFeatures = kGamesFeatures.get(gameClassId);

		if (gameFeatures?.length) {
			this._gameEventsListener = new OWGamesEvents(
				{
					onInfoUpdates: this.onInfoUpdates.bind(this),
					onNewEvents: this.onNewEvents.bind(this),
				},
				gameFeatures,
			);

			this._gameEventsListener.start();
		}
	}

	private _lastWrittenAS: number = 0;

	private onInfoUpdates(info) {
		if (!info.live_client_data) {
			return;
		}
		const activePlayer = JSON.parse(info.live_client_data.active_player);
		if (activePlayer?.championStats?.attackSpeed !== undefined) {
			const as = activePlayer.championStats.attackSpeed;
			this.logLine(this._infoLog, as, false);

			// Write to localStorage for desktop_second to consume
			// Throttle: only write if attack speed changed by > 0.01
			if (Math.abs(as - this._lastWrittenAS) > 0.01) {
				this._lastWrittenAS = as;
				localStorage.setItem("tempo_champion", JSON.stringify({
					name: activePlayer.summonerName || "In Game",
					attackSpeed: as,
				}));
			}
		}
	}

	// Special events will be highlighted in the event log
	private onNewEvents(e) {
		const shouldHighlight = e.events.some((event) => {
			switch (event.name) {
				case "kill":
				case "death":
				case "assist":
				case "level":
				case "matchStart":
				case "match_start":
				case "matchEnd":
				case "match_end":
					return true;
			}

			return false;
		});
		this.logLine(this._eventsLog, e, shouldHighlight);
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

	// Appends a new line to the specified log
	private logLine(log: HTMLElement, data, highlight) {
		const line = document.createElement("pre");
		line.textContent = JSON.stringify(data);

		if (highlight) {
			line.className = "highlight";
		}

		// Check if scroll is near bottom
		const shouldAutoScroll =
			log.scrollTop + log.offsetHeight >= log.scrollHeight - 10;

		log.appendChild(line);

		if (shouldAutoScroll) {
			log.scrollTop = log.scrollHeight;
		}
	}

	private async getCurrentGameClassId(): Promise<number | null> {
		const info = await OWGames.getRunningGameInfo();

		return info?.isRunning && info.classId ? info.classId : null;
	}
}

InGame.instance().run();
