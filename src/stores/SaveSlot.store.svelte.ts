// BROWSER ONLY

import type { CelesteSaveSlot } from "../domain/Celeste";
import Celeste from "../domain/Celeste";
import { GetDependency } from "../setup";

class SaveSlotStore {
	public selectedSaveSlot = $state<number>(0);
	public availableSaveSlots = $state<CelesteSaveSlot[]>([]);
	public isLoading = $state<boolean>(true);

	constructor() {
		this.Initialize();
	}

	public async Initialize(): Promise<void> {
		this.isLoading = true;
		try {
			const celeste = GetDependency(Celeste);
			const slots = await celeste.GetAllSaveSlots();
			this.availableSaveSlots = slots;

			if (slots.length > 0 && !slots.some((s) => s.slotNumber === this.selectedSaveSlot)) {
				this.selectedSaveSlot = slots[0].slotNumber;
			}
		} catch {
			this.availableSaveSlots = [];
		} finally {
			this.isLoading = false;
		}
	}

	public SetSelectedSaveSlot(slotNumber: number): void {
		this.selectedSaveSlot = slotNumber;
	}

	public RefreshSaveSlots(): Promise<void> {
		return this.Initialize();
	}
}

const saveSlotStore = new SaveSlotStore();
export default saveSlotStore;
