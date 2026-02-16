import { AppWindow } from "../AppWindow";
import { kGamesFeatures, kLauncherClassId, kWindowNames } from "../consts";

class Desktop extends AppWindow {
	private static _instance: Desktop;
	private _eventsLog: HTMLElement;
	private _infoLog: HTMLElement;

	private constructor() {
		super(kWindowNames.desktop);

		this._eventsLog = document.getElementById("eventsLog");
		this._infoLog = document.getElementById("infoLog");
	}

	public static instance() {
		if (!Desktop._instance) {
			Desktop._instance = new Desktop();
		}

		return Desktop._instance;
	}

	public async run() {
		const launcherFeatures = kGamesFeatures.get(kLauncherClassId);

		if (!launcherFeatures?.length) {
			return;
		}

		overwolf.games.launchers.events.setRequiredFeatures(
			kLauncherClassId,
			launcherFeatures,
			(result) => {
				if (result.success) {
					console.log("Launcher features set:", result);
				} else {
					console.error("Failed to set launcher features:", result);
				}
			},
		);

		overwolf.games.launchers.events.onInfoUpdates.addListener(
			this.onInfoUpdates.bind(this),
		);

		overwolf.games.launchers.events.onNewEvents.addListener(
			this.onNewEvents.bind(this),
		);
	}

	private onInfoUpdates(info) {
		this.logLine(this._infoLog, info, false);
	}

	private onNewEvents(e) {
		this.logLine(this._eventsLog, e, false);
	}

	private logLine(log: HTMLElement, data, highlight) {
		const line = document.createElement("pre");
		line.textContent = JSON.stringify(data);

		if (highlight) {
			line.className = "highlight";
		}

		const shouldAutoScroll =
			log.scrollTop + log.offsetHeight >= log.scrollHeight - 10;

		log.appendChild(line);

		if (shouldAutoScroll) {
			log.scrollTop = log.scrollHeight;
		}
	}
}

Desktop.instance().run();
