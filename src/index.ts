import neutralino from '@neutralinojs/lib';
import { mount } from 'svelte';
import App from './index.svelte';

neutralino.init();

const target = document.getElementById('app');

if (!target) {
	throw new Error("Could not find element with id 'app'");
}

const app = mount(App, {
	target,
});

export default app;
