// biome-ignore-all assist/source/organizeImports: Imports are organized by usage
import neutralino from '@neutralinojs/lib';
neutralino.init();
neutralino.events.on('ready', () => {
	Log_Info('Neutralino: Ready');
	neutralino.window.show();
});

import { mount } from 'svelte';
import App from './index.svelte';
import { Log_Info } from './libs/Logger';
const target = document.getElementById('app');
if (!target) {
	throw new Error("Could not find element with id 'app'");
}
const app = mount(App, {
	target,
});

export default app;
