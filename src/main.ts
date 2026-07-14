import { mount } from 'svelte';
import App from './main.svelte';

import { init } from "@neutralinojs/lib";

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app

init();
