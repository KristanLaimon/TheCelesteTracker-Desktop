// UNIVERSAL COMPATIBILITY
import { serializeError } from "serialize-error";
import { injectable } from "tsyringe";
import Everest, { type EverestModInfo } from "./Everest";
import { Log_Error, Log_Info } from "./Logger";
import type MaddiesApi from "./MaddiesAPI";
import type { MaddiesApiModInfo } from "./MaddiesAPI";
import Storage from "./Storage";

const STORAGE_KEY_ALL_EVEREST_MODS_INFO  = "localmods_allInstalled";
const STORAGE_KEY_MAP_EVERESTMODID_TO_EVERESTMOD = "LocalMods_Map_ModId_To_EverestInfoMod"
const STORAGE_KEY_MAP_EVERESTMODID_TO_MADDIESMODINFO = "LocalMods_Map_ModId_To_MaddiesInfo";
const STORAGE_KEY_MAP_HUMANNAME_TO_EVEREST_MOD_ID  = "LocalMods_Map_HumanName_To_ModId"


export type LocalModsOptions = {
  invalidateCache: {
    ALL_EVEREST_MODS_INFO?:boolean;
    MAP_EVERESTMODID_TO_EVERESTMOD?:boolean;
    EVERESTMODID_TO_MADDIESMODINFO?:boolean;
    HUMANNAME_TO_EVEREST_MOD_ID?:boolean;
  }
};

@injectable()
export default class LocalMods {
  
  constructor(
    private everest: Everest,
    private storage: Storage,
    private maddiesApi: MaddiesApi
  ){
    storage.configureAutoSave("turn off");
  }

  //OK
  public async EverestMods_GetAll(opts?:LocalModsOptions):Promise<EverestModInfo[]>{
    Log_Info("LocalMods.ts:", "About to load all mods full!")
    const toReturn= await this.storage.get<EverestModInfo[]>(STORAGE_KEY_ALL_EVEREST_MODS_INFO , async () => {
      return await this.everest.GetModsInstalledFull({workerCount: 4})
    },{invalidateCache:opts?.invalidateCache.ALL_EVEREST_MODS_INFO});
    Log_Info("LocalMods.ts:", "All mods info loaded")
    return toReturn;
  }
  
  //OK
  public async EverestMods_GetMap_ModId_EverestMod(opts?:LocalModsOptions){
    type Map_ModId_EverestMod = Record<string /** HumanName:string */,EverestModInfo>;

    return await this.storage.get<Map_ModId_EverestMod>(STORAGE_KEY_MAP_EVERESTMODID_TO_EVERESTMOD, async ()=> {
      const allMods = await this.EverestMods_GetAll(opts);
      if (!allMods || allMods.length === 0) return {} satisfies Map_ModId_EverestMod;
      const toReturn : Map_ModId_EverestMod = {}
      allMods.forEach((x) => { if (typeof x.metadata.name !== "undefined"&& x.metadata.name && x.metadata.name.trim() != "") toReturn[x.metadata.name] = x })
      return toReturn;
    }, {invalidateCache: opts?.invalidateCache.MAP_EVERESTMODID_TO_EVERESTMOD});
  }

  //OK
  public async EverestMods_GetMap_HumanName_EverestModId(opts?:LocalModsOptions):Promise<Record<string, string>>{
    type Map_HumanName_EverestModId = Record<string, string>;

    return await this.storage.get<Map_HumanName_EverestModId>(STORAGE_KEY_MAP_HUMANNAME_TO_EVEREST_MOD_ID, async () => {
      const allMods = await this.EverestMods_GetAll(opts);
      if (!allMods || allMods.length === 0) return {} satisfies Map_HumanName_EverestModId;
      const toReturn: Map_HumanName_EverestModId = {};
      allMods.forEach((x) => {if (typeof x.humanName !== "undefined" && x.humanName && x.humanName.trim() !== "") toReturn[x.humanName] = x.metadata.name});
      return toReturn;
    }, {invalidateCache: opts?.invalidateCache.HUMANNAME_TO_EVEREST_MOD_ID});
  }

 public async MaddiesAPI_GetMap_EverestModId_MaddiesModInfo( opts?: LocalModsOptions) {
    type Map_EverestModId_MaddiesModInfo = Record<string, MaddiesApiModInfo>;

    return await this.storage.get<Map_EverestModId_MaddiesModInfo>( STORAGE_KEY_MAP_EVERESTMODID_TO_MADDIESMODINFO, async () => {
        const allMods = await this.EverestMods_GetAll(opts);
        if (!allMods || allMods.length === 0) return {};

        type MaddiesLookupResult = {
          everestModId: string;
          maddiesInfo: MaddiesApiModInfo;
        } | null;

        const settledResults = await Promise.allSettled(
          allMods.map<Promise<MaddiesLookupResult>>(async (mod) => {
            const everestModId = mod.metadata.name;
            try {
              const searchResults = await this.maddiesApi.SearchModByName(mod.humanName);
              const bestMatch = searchResults[0];
              if (!bestMatch) return null;

              return { everestModId, maddiesInfo: bestMatch };
            } catch (e: unknown) {
              Log_Error( "LocalMods.ts:", "| When trying to fetch maddies api info, got error | Error =>", serializeError(e));
              throw e; // let's let allSettled() capture this as "rejected"
            }
          })
        );

        const map: Map_EverestModId_MaddiesModInfo = {};
        for (const result of settledResults) {
          if (result.status !== "fulfilled" || result.value === null) continue;
          map[result.value.everestModId] = result.value.maddiesInfo;
        }

        return map;
      },
      { invalidateCache: opts?.invalidateCache.EVERESTMODID_TO_MADDIESMODINFO }
    );
  }


  public async EverestMods_GetModByHumanName(modHumanName:string, opts?:LocalModsOptions):Promise<EverestModInfo | null>{
    const modsInstalled = await this.EverestMods_GetMap_ModId_EverestMod(opts);
    return modsInstalled[modHumanName] ?? null;
  }

  public async EverestMods_GetListHumanName(opts?:LocalModsOptions):Promise<string[]>{
    const map = await this.EverestMods_GetMap_ModId_EverestMod(opts);
    return Object.keys(map).filter(k => k && k !== 'undefined');
  }

  public async destroy(){
    await this.storage.triggerSave();
    this.storage.destroy();
  }
}