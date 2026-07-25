// BROWSER ONLY
// biome-ignore-all assist/source/organizeImports: Imports are organized by usage
import neutralino from "@neutralinojs/lib";
import { mount, unmount } from "svelte";
import Loading from "./components/Loading.svelte";
import App from "./index.svelte";
import BrowserPath from "./core/BrowserPath";
import Configuration from "./domain/Configuration";
import { Log_Info } from "./utils/Logger";
import { NeutralinoFileSystem } from "./core/NeutralinoFileSystem";
import { get } from "./setup";

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
	Log_Info("Neutralino: Ready");
	const path = new BrowserPath();
	const fs = new NeutralinoFileSystem(path);

	//if doesnt exist only
	fs.createDirectory("./data").then(() => {
		Log_Info("Neutralinod:", "Ensuring ./data folder exists");

		NeutralinoFileSystem.MountLocalFolders().then(() => {
			Log_Info("Neutralino: Mounted local folders");

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
