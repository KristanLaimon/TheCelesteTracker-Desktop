import "reflect-metadata";

import neutralino from "@neutralinojs/lib";
import { mount, unmount } from "svelte";
import Loading from "./components/Loading.svelte";
import BrowserPath from "./core/BrowserPath";
import { NeutralinoFileSystem } from "./core/NeutralinoFileSystem";
import Configuration from "./domain/Configuration";
import App from "./index.svelte";
import { get } from "./setup";
import { logger } from "./utils/Logger";

neutralino.init();

// biome-ignore lint/suspicious/noExplicitAny: compatibility type
let appInstance: any = null;
// biome-ignore lint/suspicious/noExplicitAny: compatibility type
let loadingInstance: any = null;

const target = document.getElementById("app");
if (!target) throw new Error("Could not find element with id 'app'");

// First mount the loading component
loadingInstance = mount(Loading, {
	target,
});

neutralino.events.on("ready", () => {
	logger.info("Neutralino: Ready");
	const path = new BrowserPath();
	const fs = new NeutralinoFileSystem(path);

	//if doesnt exist only
	fs.createDirectory("./data").then(() => {
		logger.info("Neutralino: Ensuring ./data folder exists");

		NeutralinoFileSystem.MountLocalFolders().then(() => {
			logger.info("Neutralino: Mounted local folders");

			const configuration = get(Configuration);
			configuration.initialize().then(() => {
				unmount(loadingInstance);
				loadingInstance = null;

				appInstance = mount(App, {
					target,
				});

				setTimeout(() => {
					neutralino.window.show();
				}, 150);
			});
		});
	});
});

export default appInstance;
