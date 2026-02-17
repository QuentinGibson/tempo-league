import { AppWindow } from "../AppWindow";
import { kGamesFeatures, kLauncherClassId, kWindowNames } from "../consts";

class Desktop extends AppWindow {
	private static _instance: Desktop;
	private _eventsLog: HTMLElement;
	private _infoLog: HTMLElement;
	private _championMap: Map<number, { name: string; attackSpeed: number }> =
		new Map();

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
		await this.loadChampionMap();

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
		if (!info.info?.champ_select?.raw) {
			// Champ select data cleared — user left lobby
			localStorage.removeItem("tempo_champion");
			return;
		}

		try {
			const raw = JSON.parse(info.info.champ_select.raw);
			const localPlayer = raw.myTeam?.find(
				(p) => p.cellId === raw.localPlayerCellId,
			);
			if (localPlayer) {
				const championId =
					localPlayer.championId || localPlayer.championPickIntent;
				const champ = this._championMap.get(championId);
				const display = champ
					? `${champ.name} - AS: ${champ.attackSpeed}`
					: String(championId);
				this.logLine(this._eventsLog, display, false);

				if (champ) {
					localStorage.setItem(
						"tempo_champion",
						JSON.stringify({
							name: champ.name,
							attackSpeed: champ.attackSpeed,
						}),
					);
				}
			}
		} catch (e) {
			console.error("Failed to parse champ_select raw:", e);
		}
	}

	private onNewEvents() {}

	private async loadChampionMap() {
		try {
			const versionRes = await fetch(
				"https://ddragon.leagueoflegends.com/api/versions.json",
			);
			const versions = await versionRes.json();
			const latest = versions[0];

			const champRes = await fetch(
				`https://ddragon.leagueoflegends.com/cdn/${latest}/data/en_US/champion.json`,
			);
			const champData = await champRes.json();

			for (const champ of Object.values(champData.data) as any[]) {
				this._championMap.set(Number(champ.key), {
					name: champ.name,
					attackSpeed: champ.stats.attackspeed,
				});
			}
		} catch (e) {
			console.error("Failed to load champion data:", e);
		}
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
