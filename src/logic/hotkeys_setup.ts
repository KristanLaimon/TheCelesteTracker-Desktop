import Hotkeys from 'hotkeys-js';
import { router } from '../router.svelte';

function registerHotkey(key: string, callback: () => void) {
	const registered = Hotkeys.getAllKeyCodes();
	const exists = registered.some((item) => item.shortcut === key);
	if (!exists) {
		Hotkeys(key, callback);
	}
}

registerHotkey('ctrl+d', () => {
	router.navigate('/dev');
});

registerHotkey('ctrl+m', () => {
	router.navigate('/');
});

registerHotkey('ctrl+t', () => {
	router.navigate('/test');
});
