// biome-ignore-all assist/source/organizeImports: Imports are organized by usage
import neutralino from '@neutralinojs/lib';
import { mount } from 'svelte';
import App from './index.svelte';
import { Log_Info } from './libs/Logger';

neutralino.init();

let isNeutralinoReady = false;
let isAppReady = false;

function showWindowIfReady() {
	if (isNeutralinoReady && isAppReady) {
		// A small delay to let the browser parse styles and paint the Svelte layout
		setTimeout(() => {
			neutralino.window.show();
		}, 150);
	}
}

neutralino.events.on('ready', () => {
	Log_Info('Neutralino: Ready');
	isNeutralinoReady = true;
	showWindowIfReady();
});

const target = document.getElementById('app');
if (!target) throw new Error("Could not find element with id 'app'");
const app = mount(App, {
	target,
});
isAppReady = true;

showWindowIfReady();

export default app;
