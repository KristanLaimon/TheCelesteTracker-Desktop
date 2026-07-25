// UNIVERSAL COMPATIBILITY
import { Log_Warn } from "../../utils/Logger";
import type { CanvasNodeData } from "./Canvas.types";

/**
 * Interface representing the deserialized view configuration.
 */
export interface ViewState {
	x: number;
	y: number;
	zoom: number;
}

/**
 * Sanitizes loaded node properties to ensure valid formats.
 */
export function sanitizeNodes(loadedNodes: CanvasNodeData<any>[]): CanvasNodeData<any>[] {
	// ponytail: simplified mapped sanitization for nodes
	return loadedNodes.map((node) => {
		const sanitized = { ...node };
		if (!sanitized.id) {
			sanitized.id = crypto.randomUUID();
		}
		if (typeof sanitized.x !== "number" || !Number.isFinite(sanitized.x)) {
			sanitized.x = 0;
		}
		if (typeof sanitized.y !== "number" || !Number.isFinite(sanitized.y)) {
			sanitized.y = 0;
		}
		if (sanitized.width !== undefined && (typeof sanitized.width !== "number" || !Number.isFinite(sanitized.width))) {
			sanitized.width = undefined;
		}
		if (sanitized.height !== undefined && (typeof sanitized.height !== "number" || !Number.isFinite(sanitized.height))) {
			sanitized.height = undefined;
		}
		return sanitized;
	});
}

/**
 * Attempts to parse fallback legacy payload.
 */
function parseLegacyPayload(storage: string): { nodes: CanvasNodeData<any>[]; view: ViewState | null } | null {
	try {
		const parsed = JSON.parse(storage);
		if (Array.isArray(parsed)) {
			return { nodes: parsed as CanvasNodeData<any>[], view: null };
		}
		if (parsed && typeof parsed === "object") {
			const nodes = (parsed.nodes || []) as CanvasNodeData<any>[];
			let view: ViewState | null = null;
			if (parsed.view) {
				const vx = Number(parsed.view.x);
				const vy = Number(parsed.view.y);
				const vz = Number(parsed.view.zoom);
				if (!Number.isNaN(vx) && Number.isFinite(vx) && !Number.isNaN(vy) && Number.isFinite(vy) && !Number.isNaN(vz) && Number.isFinite(vz) && vz > 0) {
					view = { x: vx, y: vy, zoom: vz };
				}
			}
			return { nodes, view };
		}
	} catch (err) {
		Log_Warn(`Canvas -> Failed to parse fallback legacy storage: ${err}`);
	}
	return null;
}

/**
 * Loads persistent node array and viewport state from localStorage.
 */
export function loadPersistentState(key: string): { nodes: CanvasNodeData<any>[] | null; view: ViewState | null } {
	const nodesStorage = localStorage.getItem(`${key}_nodes`);
	const viewStorage = localStorage.getItem(`${key}_view`);
	let nodes: CanvasNodeData<any>[] | null = null;
	let view: ViewState | null = null;

	if (nodesStorage) {
		try {
			nodes = JSON.parse(nodesStorage);
		} catch (err) {
			Log_Warn(`Canvas -> Failed to parse persistent nodes: ${err}`);
		}
	}

	if (viewStorage) {
		try {
			const parsedView = JSON.parse(viewStorage);
			if (parsedView) {
				const vx = Number(parsedView.x);
				const vy = Number(parsedView.y);
				const vz = Number(parsedView.zoom);
				if (!Number.isNaN(vx) && Number.isFinite(vx) && !Number.isNaN(vy) && Number.isFinite(vy) && !Number.isNaN(vz) && Number.isFinite(vz) && vz > 0) {
					view = { x: vx, y: vy, zoom: vz };
				}
			}
		} catch (err) {
			Log_Warn(`Canvas -> Failed to parse persistent view: ${err}`);
		}
	}

	// Fallback to legacy key
	if (!nodesStorage && !viewStorage) {
		const storage = localStorage.getItem(key);
		if (storage) {
			const legacy = parseLegacyPayload(storage);
			if (legacy) {
				nodes = legacy.nodes;
				view = legacy.view;
			}
		}
	}

	if (nodes) {
		nodes = sanitizeNodes(nodes);
	}

	return { nodes, view };
}

/**
 * Saves state values to storage.
 */
export function savePersistentState(key: string, nodes: CanvasNodeData<any>[], view: ViewState): void {
	try {
		localStorage.setItem(`${key}_nodes`, JSON.stringify(nodes));
		localStorage.setItem(`${key}_view`, JSON.stringify(view));
		localStorage.removeItem(key); // clean legacy key
	} catch (err) {
		Log_Warn(`Canvas -> Failed to save persistent storage: ${err}`);
	}
}
