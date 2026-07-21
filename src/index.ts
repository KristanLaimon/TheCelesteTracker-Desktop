// BROWSER ONLY
// biome-ignore-all assist/source/organizeImports: Imports are organized by usage
import neutralino from '@neutralinojs/lib';
import { mount, unmount } from 'svelte';
import Loading from './components/Loading.svelte';
import App from './index.svelte';
import { Log_Info } from './libs/Logger';
import { NeutralinoFileSystem } from './libs/NeutralinoFileSystem';

neutralino.init();

// biome-ignore lint/suspicious/noExplicitAny: compatibility type
let appInstance: any = null;
// biome-ignore lint/suspicious/noExplicitAny: compatibility type
let loadingInstance: any = null;

const target = document.getElementById('app');
if (!target) throw new Error("Could not find element with id 'app'");

// First mount the loading component
loadingInstance = mount(Loading, {
	target,
});

neutralino.events.on('ready', () => {
	Log_Info('Neutralino: Ready');
	NeutralinoFileSystem.MountLocalFolders();

	// Unmount loading component and mount the actual app
	unmount(loadingInstance);
	loadingInstance = null;

	appInstance = mount(App, {
		target,
	});

	setTimeout(() => {
		neutralino.window.show();
	}, 150);
});

export default appInstance;
