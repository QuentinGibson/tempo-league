import { AppWindow } from "../AppWindow";
import { kWindowNames } from "../consts";

class DesktopSecond extends AppWindow {
	private static _instance: DesktopSecond;

	private constructor() {
		super(kWindowNames.desktopSecond);
	}

	public static instance() {
		if (!DesktopSecond._instance) {
			DesktopSecond._instance = new DesktopSecond();
		}

		return DesktopSecond._instance;
	}

	public async run() {
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
				secondMonitor.y
			);
		});
	}
}

DesktopSecond.instance().run();
