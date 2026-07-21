// UNIVERSAL COMPATIBILITY
import { injectable } from "tsyringe";
import Everest, { type EverestModInfo } from "./Everest";
import Olympus from "./Olympus";
import Storage from "./Storage";

const LocalMods_InstalledModsAll = "localmods_allInstalled";
const LocalMods_MapModIdToModHumanName = "localmods_modidTOmodhumanname"
const LocalMods_MapHumanModNameToFileName = "localmods_modhumannameTOfilenamemod";

// export type LocalModInstalled = {
//   humanName:string, 
//   fileName:string
// }

type LocalMod_HumanNameToFileNameMap = Record<string /** HumanName:string */,EverestModInfo>;

export type LocalModsOptions = {
  invalidateCachedNames?:boolean
};

@injectable()
export default class LocalMods {
  
  constructor(
    private olympus: Olympus,
    private everest: Everest,
    private storage: Storage
  ){
    storage.configureAutoSave("turn off");
  }

  async #GetAllModsFullInfoInstalled(opts?:LocalModsOptions){
    return await this.storage.get<EverestModInfo[]>(LocalMods_InstalledModsAll, async () => {
      return await this.everest.GetModsInstalledFull({workerCount: 4})
    });
  }

  async #GetMapHumanNameToFullModInfo(opts?:LocalModsOptions){
    return await this.storage.get<LocalMod_HumanNameToFileNameMap>(LocalMods_MapModIdToModHumanName, async ()=> {
      const allMods = await this.#GetAllModsFullInfoInstalled();
      if (!allMods || allMods.length === 0) return {} satisfies LocalMod_HumanNameToFileNameMap;
      const toReturn : LocalMod_HumanNameToFileNameMap = {}
      allMods.forEach((x) => {toReturn[x.humanName] = x})
      return toReturn;
    });
  }

  public async GetAllModsFullInfoInstalled():Promise<EverestModInfo[]>{
    return await this.#GetAllModsFullInfoInstalled();
  }

  public async GetModFullInfoByModHumanName(modHumanName:string):Promise<EverestModInfo | null>{
    const modsInstalled = await this.#GetMapHumanNameToFullModInfo();
    return modsInstalled[modHumanName] ?? null;
  }

  public async GetModsInstalledNames(opts?:{invalidateCachedNames:boolean}):Promise<string[]>{
    const map = await this.#GetMapHumanNameToFullModInfo(opts);
    return Object.keys(map); //Check LocalMod_HumanNameToFileNameMap (keys are the actual humanNames!)
  }

  public async destroy(){
    await this.storage.triggerSave();
    this.storage.destroy();
  }
}