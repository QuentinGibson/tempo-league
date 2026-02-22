import { OWGameListener, OWGames, OWGamesEvents, OWWindow } from "@overwolf/overwolf-api-ts";

import { kGameClassIds, kGamesFeatures, kWindowNames } from "../consts";

import RunningGameInfo = overwolf.games.RunningGameInfo;
import AppLaunchTriggeredEvent = overwolf.extensions.AppLaunchTriggeredEvent;

// The background controller holds all of the app's background logic - hence its name. it has
// many possible use cases, for example sharing data between windows, or, in our case,
// managing which window is currently presented to the user. To that end, it holds a dictionary
// of the windows available in the app.
// Our background controller implements the Singleton design pattern, since only one
// instance of it should exist.
class BackgroundController {
	private static _instance: BackgroundController;
	private _windows: Record<string, OWWindow> = {};
	private _gameListener: OWGameListener;
	private _gameEventsListener: OWGamesEvents;
	private _lastWrittenAS: number = 0;

	private constructor() {
		// Populating the background controller's window dictionary
		this._windows[kWindowNames.desktop] = new OWWindow(kWindowNames.desktop);
		this._windows[kWindowNames.desktopSecond] = new OWWindow(
			kWindowNames.desktopSecond,
		);
		this._windows[kWindowNames.inGame] = new OWWindow(kWindowNames.inGame);

		// When a a supported game game is started or is ended, toggle the app's windows
		this._gameListener = new OWGameListener({
			onGameStarted: this.toggleWindows.bind(this),
			onGameEnded: this.toggleWindows.bind(this),
		});

		overwolf.extensions.onAppLaunchTriggered.addListener((e) =>
			this.onAppLaunchTriggered(e),
		);
	}

	// Implementing the Singleton design pattern
	public static instance(): BackgroundController {
		if (!BackgroundController._instance) {
			BackgroundController._instance = new BackgroundController();
		}

		return BackgroundController._instance;
	}

	// When running the app, start listening to games' status and decide which window should
	// be launched first, based on whether a supported game is currently running
	public async run() {
		this._gameListener.start();

		if (await this.isSupportedGameRunning()) {
			this._windows[kWindowNames.inGame].restore();
			this.startGameEventsListener();
		} else {
			this._windows[kWindowNames.desktop].restore();
		}

		// Always open the second monitor window
		this._windows[kWindowNames.desktopSecond].restore();
	}

	private async onAppLaunchTriggered(e: AppLaunchTriggeredEvent) {
		console.log("onAppLaunchTriggered():", e);

		if (!e || e.origin.includes("gamelaunchevent")) {
			return;
		}

		if (await this.isSupportedGameRunning()) {
			this._windows[kWindowNames.desktop].close();
			this._windows[kWindowNames.inGame].restore();
			// Keep desktop_second open for real-time BPM during game
		} else {
			this._windows[kWindowNames.desktop].restore();
			this._windows[kWindowNames.desktopSecond].restore();
			this._windows[kWindowNames.inGame].close();
		}
	}

	private toggleWindows(info: RunningGameInfo) {
		if (!info || !this.isSupportedGame(info)) {
			return;
		}

		if (info.isRunning) {
			this._windows[kWindowNames.desktop].close();
			this._windows[kWindowNames.inGame].restore();
			this._windows[kWindowNames.desktopSecond].restore();
			this._windows[kWindowNames.desktopSecond].maximize();
			this.startGameEventsListener();
		} else {
			this._windows[kWindowNames.desktop].restore();
			this._windows[kWindowNames.desktopSecond].restore();
			this._windows[kWindowNames.inGame].close();
			this._lastWrittenAS = 0;
			localStorage.removeItem("tempo_champion");
		}
	}

	private async startGameEventsListener() {
		const info = await OWGames.getRunningGameInfo();
		if (!info?.isRunning) return;

		const gameFeatures = kGamesFeatures.get(info.classId);
		if (!gameFeatures?.length) return;

		this._gameEventsListener = new OWGamesEvents(
			{
				onInfoUpdates: this.onGameInfoUpdates.bind(this),
				onNewEvents: this.onGameNewEvents.bind(this),
			},
			gameFeatures,
		);
		this._gameEventsListener.start();
	}

	private onGameInfoUpdates(info) {
		if (!info.live_client_data) return;
		try {
			const activePlayer = JSON.parse(info.live_client_data.active_player);
			const as = activePlayer?.championStats?.attackSpeed;
			if (as !== undefined && Math.abs(as - this._lastWrittenAS) > 0.01) {
				this._lastWrittenAS = as;
				localStorage.setItem(
					"tempo_champion",
					JSON.stringify({ name: activePlayer.summonerName || "In Game", attackSpeed: as }),
				);
			}
		} catch (e) {
			console.error("Failed to parse live_client_data:", e);
		}
	}

	private onGameNewEvents(e) {
		const matchEnded = e.events.some(
			(event) => event.name === "matchEnd" || event.name === "match_end",
		);
		if (matchEnded) {
			this._lastWrittenAS = 0;
			localStorage.removeItem("tempo_champion");
		}
	}

	private async isSupportedGameRunning(): Promise<boolean> {
		const info = await OWGames.getRunningGameInfo();

		return info?.isRunning && this.isSupportedGame(info);
	}

	// Identify whether the RunningGameInfo object we have references a supported game
	private isSupportedGame(info: RunningGameInfo) {
		return kGameClassIds.includes(info.classId);
	}
}

BackgroundController.instance().run();
