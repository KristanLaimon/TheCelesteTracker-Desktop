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
    if (!opts?.invalidateCachedNames){
      const alreadyFound = await this.storage.get<string[]>(LocalMods_ModNames_Key);
      if (alreadyFound && alreadyFound.length > 0){
        return alreadyFound;
      }
    }
    const res = await this.everest.GetModsInstalled({workerCount: 5})
    const toReturn = res.map(a => a.name);
    await this.storage.set(LocalMods_ModNames_Key, toReturn);
    await this.storage.triggerSave();
    return toReturn;
  }

  public async destroy(){
    await this.storage.triggerSave();
    this.storage.destroy();
  }
}