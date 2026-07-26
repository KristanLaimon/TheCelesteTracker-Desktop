import "reflect-metadata";
import { DB_Mods as dbMods } from "./setup";

const a = await dbMods.EverestMods_Get_ListModIds();
console.dir(a, { depth: null, color: true });
