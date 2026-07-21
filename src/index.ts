// BROWSER ONLY
// biome-ignore-all assist/source/organizeImports: Imports are organized by usage
import neutralino from '@neutralinojs/lib';
import { mount, unmount } from 'svelte';
import Loading from './components/Loading.svelte';
import App from './index.svelte';
import BrowserPath from "./libs/BrowserPath";
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

neutralino.events.on('ready', async () => {
	Log_Info('Neutralino: Ready');
  const path = new BrowserPath();
  const fs = new NeutralinoFileSystem(path);

  //if doesnt exist only
  fs.createDirectory("./data").then(()=> {
    Log_Info("Neutralinod:", "Ensuring ./data folder exists");

    NeutralinoFileSystem.MountLocalFolders().then(() => {
      Log_Info("Neutralino: Mounted local folders")
      unmount(loadingInstance);
      loadingInstance = null;

      appInstance = mount(App, {
        target,
      });

      setTimeout(() => {
        neutralino.window.show();
      }, 150);
    })
  })

});

export default appInstance;
