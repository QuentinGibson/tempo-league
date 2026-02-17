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

	public async run() {}
}

DesktopSecond.instance().run();
