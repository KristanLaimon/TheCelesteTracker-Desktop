// UNIVERSAL COMPATIBILITY
import { injectable } from "tsyringe";
import Everest from "./Everest";
import Olympus from "./Olympus";
import Storage from "./Storage";

@injectable()
export default class LocalMods {
  constructor(
    private olympus: Olympus,
    private everest: Everest,
    private storage: Storage
  ){
    storage.configureAutoSave("turn on");
    storage.configureAutoSaveMinutesTime(30);
  }
}