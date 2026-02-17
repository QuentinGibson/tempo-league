import { AppWindow } from "../AppWindow";
import { kWindowNames } from "../consts";

class DesktopSecond extends AppWindow {
	private static _instance: DesktopSecond;

	private _orbWrap: HTMLElement;
	private _orb: HTMLElement;
	private _bpmValue: HTMLElement;
	private _champName: HTMLElement;
	private _asValue: HTMLElement;
	private _readout: HTMLElement;
	private _waitingState: HTMLElement;

	private _sizeSlider: HTMLInputElement;
	private _sizeValue: HTMLElement;
	private _intensitySlider: HTMLInputElement;
	private _intensityValue: HTMLElement;
	private _colorSwatches: HTMLElement;
	private _styleToggles: HTMLElement;
	private _animeDropdown: HTMLElement;
	private _animeDropdownToggle: HTMLElement;
	private _animeDropdownArrow: HTMLElement;
	private _animeDropdownBody: HTMLElement;
	private _animeImageUrl: HTMLInputElement;
	private _animeCharImg: HTMLImageElement;
	private _animeScaleSlider: HTMLInputElement;
	private _animeScaleValue: HTMLElement;
	private _animeOffsetXSlider: HTMLInputElement;
	private _animeOffsetXValue: HTMLElement;
	private _animeOffsetYSlider: HTMLInputElement;
	private _animeOffsetYValue: HTMLElement;
	private _animeCharacter: HTMLElement;

	private constructor() {
		super(kWindowNames.desktopSecond);

		this._orbWrap = document.getElementById("orbWrap");
		this._orb = document.getElementById("orb");
		this._bpmValue = document.getElementById("bpmValue");
		this._champName = document.getElementById("champName");
		this._asValue = document.getElementById("asValue");
		this._readout = document.getElementById("readout");
		this._waitingState = document.getElementById("waitingState");

		this._sizeSlider = document.getElementById("sizeSlider") as HTMLInputElement;
		this._sizeValue = document.getElementById("sizeValue");
		this._intensitySlider = document.getElementById("intensitySlider") as HTMLInputElement;
		this._intensityValue = document.getElementById("intensityValue");
		this._colorSwatches = document.getElementById("colorSwatches");
		this._styleToggles = document.getElementById("styleToggles");
		this._animeDropdown = document.getElementById("animeDropdown");
		this._animeDropdownToggle = document.getElementById("animeDropdownToggle");
		this._animeDropdownArrow = document.getElementById("animeDropdownArrow");
		this._animeDropdownBody = document.getElementById("animeDropdownBody");
		this._animeImageUrl = document.getElementById("animeImageUrl") as HTMLInputElement;
		this._animeCharImg = document.getElementById("animeCharImg") as HTMLImageElement;
		this._animeCharacter = document.getElementById("animeCharacter");
		this._animeScaleSlider = document.getElementById("animeScaleSlider") as HTMLInputElement;
		this._animeScaleValue = document.getElementById("animeScaleValue");
		this._animeOffsetXSlider = document.getElementById("animeOffsetXSlider") as HTMLInputElement;
		this._animeOffsetXValue = document.getElementById("animeOffsetXValue");
		this._animeOffsetYSlider = document.getElementById("animeOffsetYSlider") as HTMLInputElement;
		this._animeOffsetYValue = document.getElementById("animeOffsetYValue");
	}

	public static instance() {
		if (!DesktopSecond._instance) {
			DesktopSecond._instance = new DesktopSecond();
		}

		return DesktopSecond._instance;
	}

	public async run() {
		this.moveToSecondMonitor();
		this.initSettings();

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

	private initSettings() {
		const saved = localStorage.getItem("tempo_settings");
		if (saved) {
			try {
				const s = JSON.parse(saved);
				if (s.animeImageUrl) this.applyAnimeImage(s.animeImageUrl);
				if (s.animeScale != null) this.applyAnimeScale(s.animeScale);
				if (s.animeOffsetX != null) this.applyAnimeOffsetX(s.animeOffsetX);
				if (s.animeOffsetY != null) this.applyAnimeOffsetY(s.animeOffsetY);
				if (s.style) this.applyStyle(s.style);
				if (s.color) this.applyColor(s.color.core, s.color.glow, s.color.dim);
				if (s.size) this.applySize(s.size);
				if (s.intensity) this.applyIntensity(s.intensity);
			} catch (e) {
				console.error("Failed to load settings:", e);
			}
		}

		// Style toggles
		this._styleToggles.addEventListener("click", (e: Event) => {
			const target = e.target as HTMLElement;
			if (!target.classList.contains("style-toggle")) return;

			this._styleToggles
				.querySelectorAll(".style-toggle")
				.forEach((s) => s.classList.remove("active"));
			target.classList.add("active");

			this.applyStyle(target.dataset.style);
			this.saveSettings();
		});

		// Anime dropdown toggle
		this._animeDropdownToggle.addEventListener("click", () => {
			this._animeDropdownBody.classList.toggle("hidden");
			this._animeDropdownArrow.classList.toggle("open");
		});

		// Anime image URL
		this._animeImageUrl.addEventListener("change", () => {
			const url = this._animeImageUrl.value.trim();
			this.applyAnimeImage(url);
			this.saveSettings();
		});

		// Anime scale
		this._animeScaleSlider.addEventListener("input", () => {
			this.applyAnimeScale(parseInt(this._animeScaleSlider.value, 10));
			this.saveSettings();
		});

		// Anime offset X
		this._animeOffsetXSlider.addEventListener("input", () => {
			this.applyAnimeOffsetX(parseInt(this._animeOffsetXSlider.value, 10));
			this.saveSettings();
		});

		// Anime offset Y
		this._animeOffsetYSlider.addEventListener("input", () => {
			this.applyAnimeOffsetY(parseInt(this._animeOffsetYSlider.value, 10));
			this.saveSettings();
		});

		// Color swatches
		this._colorSwatches.addEventListener("click", (e: Event) => {
			const target = e.target as HTMLElement;
			if (!target.classList.contains("color-swatch")) return;

			this._colorSwatches
				.querySelectorAll(".color-swatch")
				.forEach((s) => s.classList.remove("active"));
			target.classList.add("active");

			const core = target.dataset.core;
			const glow = target.dataset.glow;
			const dim = target.dataset.dim;
			this.applyColor(core, glow, dim);
			this.saveSettings();
		});

		// Size slider
		this._sizeSlider.addEventListener("input", () => {
			const size = parseInt(this._sizeSlider.value, 10);
			this.applySize(size);
			this.saveSettings();
		});

		// Intensity slider
		this._intensitySlider.addEventListener("input", () => {
			const intensity = parseInt(this._intensitySlider.value, 10);
			this.applyIntensity(intensity);
			this.saveSettings();
		});
	}

	private applyStyle(style: string) {
		this._orbWrap.classList.remove("pulse-orb", "pulse-radiate", "pulse-anime");
		this._orbWrap.classList.add(`pulse-${style}`);

		this._styleToggles
			.querySelectorAll(".style-toggle")
			.forEach((s: Element) => {
				const el = s as HTMLElement;
				el.classList.toggle("active", el.dataset.style === style);
			});

		// Show character settings dropdown only for anime style
		if (style === "anime") {
			this._animeDropdown.classList.remove("hidden");
		} else {
			this._animeDropdown.classList.add("hidden");
		}
	}

	private applyAnimeImage(url: string) {
		this._animeImageUrl.value = url;
		if (url) {
			this._animeCharImg.src = url;
		}
	}

	private applyAnimeScale(scale: number) {
		this._animeScaleSlider.value = String(scale);
		this._animeScaleValue.textContent = `${scale}%`;
		this._animeCharImg.style.transform = this.getAnimeImgTransform();
	}

	private applyAnimeOffsetX(x: number) {
		this._animeOffsetXSlider.value = String(x);
		this._animeOffsetXValue.textContent = String(x);
		this._animeCharImg.style.transform = this.getAnimeImgTransform();
	}

	private applyAnimeOffsetY(y: number) {
		this._animeOffsetYSlider.value = String(y);
		this._animeOffsetYValue.textContent = String(y);
		this._animeCharImg.style.transform = this.getAnimeImgTransform();
	}

	private getAnimeImgTransform(): string {
		const scale = parseInt(this._animeScaleSlider.value, 10) / 100;
		const x = parseInt(this._animeOffsetXSlider.value, 10);
		const y = parseInt(this._animeOffsetYSlider.value, 10);
		return `scale(${scale}) translate(${x}px, ${y}px)`;
	}

	private applyColor(core: string, glow: string, dim: string) {
		const root = document.documentElement;
		root.style.setProperty("--accent-core", core);
		root.style.setProperty("--accent-glow", glow);
		root.style.setProperty("--accent-dim", dim);

		// Update RGB components for glow and ring colors
		const r = parseInt(core.slice(1, 3), 16);
		const g = parseInt(core.slice(3, 5), 16);
		const b = parseInt(core.slice(5, 7), 16);
		root.style.setProperty("--accent-r", String(r));
		root.style.setProperty("--accent-g", String(g));
		root.style.setProperty("--accent-b", String(b));
		root.style.setProperty("--ring-idle", `rgba(${r}, ${g}, ${b}, 0.06)`);
		root.style.setProperty("--ring-pulse", `rgba(${r}, ${g}, ${b}, 0.25)`);

		// Mark the matching swatch as active
		this._colorSwatches
			.querySelectorAll(".color-swatch")
			.forEach((s: Element) => {
				const el = s as HTMLElement;
				el.classList.toggle("active", el.dataset.core === core);
			});
	}

	private applySize(size: number) {
		this._sizeSlider.value = String(size);
		this._sizeValue.textContent = String(size);
		this._orb.style.width = `${size}px`;
		this._orb.style.height = `${size}px`;

		// Scale everything proportionally
		const scale = size / 160;
		const wrapSize = Math.round(320 * scale);
		this._orbWrap.style.width = `${wrapSize}px`;
		this._orbWrap.style.height = `${wrapSize}px`;

		// Update tick ring size and tick transform origins
		const tickRing = this._orbWrap.querySelector(".tick-ring") as HTMLElement;
		if (tickRing) {
			tickRing.style.width = `${wrapSize}px`;
			tickRing.style.height = `${wrapSize}px`;
		}
		this._orbWrap.querySelectorAll(".tick").forEach((t: Element) => {
			(t as HTMLElement).style.transformOrigin = `0 ${wrapSize / 2}px`;
		});

		// Update ring sizes
		const rings = this._orbWrap.querySelectorAll(".ring");
		if (rings[0]) (rings[0] as HTMLElement).style.width = (rings[0] as HTMLElement).style.height = `${wrapSize}px`;
		if (rings[1]) (rings[1] as HTMLElement).style.width = (rings[1] as HTMLElement).style.height = `${Math.round(270 * scale)}px`;
		if (rings[2]) (rings[2] as HTMLElement).style.width = (rings[2] as HTMLElement).style.height = `${Math.round(220 * scale)}px`;
	}

	private applyIntensity(intensity: number) {
		this._intensitySlider.value = String(intensity);
		this._intensityValue.textContent = `${intensity}%`;
		document.documentElement.style.setProperty(
			"--pulse-scale",
			`${1 + intensity / 100}`,
		);
	}

	private saveSettings() {
		const activeSwatch = this._colorSwatches.querySelector(
			".color-swatch.active",
		) as HTMLElement;
		const activeStyle = this._styleToggles.querySelector(
			".style-toggle.active",
		) as HTMLElement;
		const settings = {
			style: activeStyle ? activeStyle.dataset.style : "orb",
			animeImageUrl: this._animeImageUrl.value.trim(),
			animeScale: parseInt(this._animeScaleSlider.value, 10),
			animeOffsetX: parseInt(this._animeOffsetXSlider.value, 10),
			animeOffsetY: parseInt(this._animeOffsetYSlider.value, 10),
			color: activeSwatch
				? {
						core: activeSwatch.dataset.core,
						glow: activeSwatch.dataset.glow,
						dim: activeSwatch.dataset.dim,
					}
				: null,
			size: parseInt(this._sizeSlider.value, 10),
			intensity: parseInt(this._intensitySlider.value, 10),
		};
		localStorage.setItem("tempo_settings", JSON.stringify(settings));
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
