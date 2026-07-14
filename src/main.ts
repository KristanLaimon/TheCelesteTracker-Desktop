import { init } from '@neutralinojs/lib';
import { mount } from 'svelte';
import App from './main.svelte';

const target = document.getElementById('app');
if (!target) {
  throw new Error("Could not find element with id 'app'");
}

const app = mount(App, {
  target,
});

export default app;

init();
