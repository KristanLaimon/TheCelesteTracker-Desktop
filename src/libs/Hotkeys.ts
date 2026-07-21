// BROWSER ONLY
import Hotkeys from 'hotkeys-js';
import { router } from '../router.svelte';

const HotkeysScopes = ['global', 'ui'] as const;
export type HotkeysScopes = (typeof HotkeysScopes)[number];

export function Hotkeys_SetScope(scope: HotkeysScopes) {
	Hotkeys.setScope(scope);
}
Hotkeys_SetScope('global');

export function Hotkeys_GetScope(): HotkeysScopes {
	return Hotkeys.getScope() as HotkeysScopes;
}

export function Hotkeys_RegisterHotkey(key: string, scope: HotkeysScopes, callback: () => void) {
	const registered = Hotkeys.getAllKeyCodes();
	const exists = registered.some((item) => item.shortcut === key);
	if (!exists) {
		Hotkeys(key, scope, callback);
	}
}

Hotkeys_RegisterHotkey('ctrl+n', 'global', () => {
	router.navigate('/database');
});

Hotkeys_RegisterHotkey('ctrl+d', 'global', () => {
	router.navigate('/dev');
});

Hotkeys_RegisterHotkey('ctrl+m', 'global', () => {
	router.navigate('/');
});

Hotkeys_RegisterHotkey('ctrl+t', 'global', () => {
	router.navigate('/test');
});
