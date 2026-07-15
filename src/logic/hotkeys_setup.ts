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
  console.log('Going to dev page');
  router.navigate('/dev', { replace: true });
});

registerHotkey('ctrl+m', () => {
  console.log('Going to main');
  router.navigate('/', { replace: true });
});
