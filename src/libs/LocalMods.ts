// UNIVERSAL COMPATIBILITY
import { injectable } from "tsyringe";
import Everest, { type EverestModInfo } from "./Everest";
import { Log_Info } from "./Logger";
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
  invalidateAllModsFullCache?:boolean
  invalidateModsIdtoFullModCache?:boolean
};

@injectable()
export default class LocalMods {
  
  constructor(
    private everest: Everest,
    private storage: Storage
  ){
    storage.configureAutoSave("turn off");
  }

  async #GetAllModsFullInfoInstalled(opts?:LocalModsOptions):Promise<EverestModInfo[]>{
    Log_Info("LocalMods.ts:", "About to load all mods full!")
    const toReturn= await this.storage.get<EverestModInfo[]>(LocalMods_InstalledModsAll, async () => {
      return await this.everest.GetModsInstalledFull({workerCount: 4})
    },{invalidateCache:opts?.invalidateAllModsFullCache});
    Log_Info("LocalMods.ts:", "All mods info loaded")
    return toReturn;
  }

  async #GetMapHumanNameToFullModInfo(opts?:LocalModsOptions){
    const toReturn = await this.storage.get<LocalMod_HumanNameToFileNameMap>(LocalMods_MapModIdToModHumanName, async ()=> {
      const allMods = await this.#GetAllModsFullInfoInstalled(opts);
      if (!allMods || allMods.length === 0) return {} satisfies LocalMod_HumanNameToFileNameMap;
      const toReturn : LocalMod_HumanNameToFileNameMap = {}
      allMods.forEach((x) => { if (typeof x.name !== "undefined"&& x.name && x.name.trim() != "") toReturn[x.name] = x })
      return toReturn;
    }, {invalidateCache: opts?.invalidateModsIdtoFullModCache});
    return toReturn;
  }

  public async GetAllModsFullInfoInstalled():Promise<EverestModInfo[]>{
    return await this.#GetAllModsFullInfoInstalled();
  }

  public async GetModFullInfoByModHumanName(modHumanName:string):Promise<EverestModInfo | null>{
    const modsInstalled = await this.#GetMapHumanNameToFullModInfo();
    return modsInstalled[modHumanName] ?? null;
  }

  public async GetModsInstalledNames(opts?:LocalModsOptions):Promise<string[]>{
    const map = await this.#GetMapHumanNameToFullModInfo(opts);
    return Object.keys(map).filter(k => k && k !== 'undefined');
  }

  public async destroy(){
    await this.storage.triggerSave();
    this.storage.destroy();
  }
}