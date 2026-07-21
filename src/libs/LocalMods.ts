// UNIVERSAL COMPATIBILITY
import { injectable } from "tsyringe";
import Everest from "./Everest";
import Olympus from "./Olympus";
import Storage from "./Storage";

const LocalMods_ModNames_Key = "localmods_modnames";

@injectable()
export default class LocalMods {
  constructor(
    private olympus: Olympus,
    private everest: Everest,
    private storage: Storage
  ){
    storage.configureAutoSave("turn off");
  }

  public async GetModsInstalledNames(opts?:{invalidateCachedNames:boolean}):Promise<string[]>{
    return await this.storage.get<string[]>(
      LocalMods_ModNames_Key, 
      async () => {
        const res = await this.everest.GetModsInstalled({workerCount: 5})
        return res.map(a => a.name);
      }, 
      {invalidateCache: opts?.invalidateCachedNames}
    );
  }

  public async destroy(){
    await this.storage.triggerSave();
    this.storage.destroy();
  }
}