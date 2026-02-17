import { AppWindow } from "../AppWindow";
import { kWindowNames } from "../consts";

class DesktopSecond extends AppWindow {
	private static _instance: DesktopSecond;

	private _orbWrap: HTMLElement;
	private _bpmValue: HTMLElement;
	private _champName: HTMLElement;
	private _asValue: HTMLElement;
	private _readout: HTMLElement;
	private _waitingState: HTMLElement;

	private constructor() {
		super(kWindowNames.desktopSecond);

		this._orbWrap = document.getElementById("orbWrap");
		this._bpmValue = document.getElementById("bpmValue");
		this._champName = document.getElementById("champName");
		this._asValue = document.getElementById("asValue");
		this._readout = document.getElementById("readout");
		this._waitingState = document.getElementById("waitingState");
	}

	public static instance() {
		if (!DesktopSecond._instance) {
			DesktopSecond._instance = new DesktopSecond();
		}

		return DesktopSecond._instance;
	}

	public async run() {
		this.moveToSecondMonitor();

		// Check if there's already champion data from a previous selection
		const existing = localStorage.getItem("tempo_champion");
		if (existing) {
			this.onChampionData(existing);
		}

		// Listen for champion changes from the desktop window
		window.addEventListener("storage", (e: StorageEvent) => {
			if (e.key === "tempo_champion" && e.newValue) {
				this.onChampionData(e.newValue);
			}
		});
	}

	private onChampionData(json: string) {
		try {
			const data = JSON.parse(json);
			const { name, attackSpeed } = data;
			if (!name || !attackSpeed) {
				return;
			}
			this.setChampion(name, attackSpeed);
		} catch (e) {
			console.error("Failed to parse champion data:", e);
		}
	}

	private setChampion(name: string, attackSpeed: number) {
		const bpm = Math.round(attackSpeed * 60);
		const beatDuration = 60 / bpm;

		this._champName.textContent = name;
		this._asValue.textContent = attackSpeed.toFixed(3);
		this._bpmValue.textContent = String(bpm);

		document.documentElement.style.setProperty(
			"--beat-duration",
			`${beatDuration}s`,
		);

		this._waitingState.classList.add("hidden");
		this._readout.classList.remove("hidden");
		this._orbWrap.classList.add("beating");
	}

	private moveToSecondMonitor() {
		overwolf.utils.getMonitorsList((result) => {
			if (!result.displays || result.displays.length < 2) {
				return;
			}

			const secondMonitor = result.displays.find((d) => !d.is_primary);
			if (!secondMonitor) {
				return;
			}

			overwolf.windows.changePosition(
				kWindowNames.desktopSecond,
				secondMonitor.x,
				secondMonitor.y,
			);
		});
	}
}

DesktopSecond.instance().run();
