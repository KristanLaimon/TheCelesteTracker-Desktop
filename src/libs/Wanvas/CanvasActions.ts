import { Log_Warn } from '../Logger';
import type { CanvasNodeData } from './Canvas.types';

export interface DragOptions {
	node: CanvasNodeData;
	getZoom: () => number;
	getDragHandleClass: () => string;
	isInteractive: (target: HTMLElement | null) => boolean;
	triggerChange: () => void;
}

export interface ResizeOptions {
	node: CanvasNodeData;
	getZoom: () => number;
	triggerChange: () => void;
}

export interface ObserveSizeOptions {
	node: CanvasNodeData;
	triggerChange: () => void;
}

/**
 * Svelte Action to handle dragging individual nodes on the canvas.
 */
export function dragNode(nodeEl: HTMLElement, initialOptions: DragOptions) {
	let options = initialOptions;
	let startX = 0;
	let startY = 0;
	let initialNodeX = 0;
	let initialNodeY = 0;
	let isDraggingNode = false;
	let hasCaptured = false;

	function handlePointerDown(e: PointerEvent) {
		// Drag on left click or touch/pointer
		if (e.button !== 0 && e.pointerType === 'mouse') return;

		const target = e.target as HTMLElement;
		const dragHandleClass = options.getDragHandleClass();
		if (dragHandleClass) {
			if (!target.closest(`.${dragHandleClass}`)) return;
		} else {
			if (options.isInteractive(target)) return;
		}

		if (options.node.isPinned) return;

		startX = e.clientX;
		startY = e.clientY;
		initialNodeX = options.node.x;
		initialNodeY = options.node.y;
		isDraggingNode = false;
		hasCaptured = false;

		nodeEl.addEventListener('pointermove', handlePointerMove);
		nodeEl.addEventListener('pointerup', handlePointerUp);
		nodeEl.addEventListener('pointercancel', handlePointerUp);
	}

	function handlePointerMove(e: PointerEvent) {
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;

		if (!isDraggingNode) {
			// ponytail: 3px threshold allows click events through
			if (Math.hypot(dx, dy) > 3) {
				isDraggingNode = true;
				try {
					nodeEl.setPointerCapture(e.pointerId);
					hasCaptured = true;
				} catch (_err) {}
			} else {
				return;
			}
		}

		e.stopPropagation();

		// Offset change divided by zoom level makes movement match pointer exactly
		options.node.x = initialNodeX + dx / options.getZoom();
		options.node.y = initialNodeY + dy / options.getZoom();
	}

	function handlePointerUp(e: PointerEvent) {
		nodeEl.removeEventListener('pointermove', handlePointerMove);
		nodeEl.removeEventListener('pointerup', handlePointerUp);
		nodeEl.removeEventListener('pointercancel', handlePointerUp);

		if (isDraggingNode) {
			isDraggingNode = false;
			if (hasCaptured) {
				try {
					nodeEl.releasePointerCapture(e.pointerId);
				} catch (_err) {}
			}
			options.triggerChange();
		}
	}

	nodeEl.addEventListener('pointerdown', handlePointerDown);

	const stopProp = (e: Event) => {
		const target = e.target as HTMLElement;
		const dragHandleClass = options.getDragHandleClass();
		if (dragHandleClass) {
			// Always stop propagation for the resize handle, even when dragHandleClass is set
			if (target.closest('.canvas-node-resize-handle')) {
				e.stopPropagation();
				return;
			}
			if (!target.closest(`.${dragHandleClass}`)) return;
		} else {
			if (options.isInteractive(target)) return;
		}
		e.stopPropagation();
	};

	nodeEl.addEventListener('mousedown', stopProp);
	nodeEl.addEventListener('touchstart', stopProp);

	return {
		update(newOptions: DragOptions) {
			// Refresh options reference
			options = newOptions;
		},
		destroy() {
			nodeEl.removeEventListener('pointerdown', handlePointerDown);
			nodeEl.removeEventListener('mousedown', stopProp);
			nodeEl.removeEventListener('touchstart', stopProp);
		},
	};
}

/**
 * Svelte Action to handle resizing individual nodes on the canvas.
 */
export function resizeNode(handleEl: HTMLElement, initialOptions: ResizeOptions) {
	let options = initialOptions;
	let startX = 0;
	let startY = 0;
	let startWidth = 0;
	let startHeight = 0;
	let minWidth = 0;
	let minHeight = 0;
	let maxWidth = Number.MAX_VALUE;
	let maxHeight = Number.MAX_VALUE;
	let isResizing = false;
	let startAspectRatio = 1.0; // ponytail: store aspect ratio at click

	function handlePointerDown(e: PointerEvent) {
		if (e.button !== 0 && e.pointerType === 'mouse') return;
		e.stopPropagation(); // prevent panning & dragging the node

		isResizing = true;
		startX = e.clientX;
		startY = e.clientY;

		const parent = handleEl.parentElement;
		if (parent) {
			startWidth = options.node.width ?? parent.offsetWidth;
			startHeight = options.node.height ?? parent.offsetHeight;
			// Avoid division by zero
			startAspectRatio = startHeight > 0 ? startWidth / startHeight : 1.0;

			const targetEl = parent.firstElementChild as HTMLElement;
			if (targetEl) {
				const computed = window.getComputedStyle(targetEl);
				minWidth = parseFloat(computed.minWidth) || 0;
				minHeight = parseFloat(computed.minHeight) || 0;

				const parsedMaxW = parseFloat(computed.maxWidth);
				maxWidth = Number.isNaN(parsedMaxW) ? Number.MAX_VALUE : parsedMaxW;

				const parsedMaxH = parseFloat(computed.maxHeight);
				maxHeight = Number.isNaN(parsedMaxH) ? Number.MAX_VALUE : parsedMaxH;
			} else {
				minWidth = 0;
				minHeight = 0;
				maxWidth = Number.MAX_VALUE;
				maxHeight = Number.MAX_VALUE;
			}
		} else {
			Log_Warn("ResizeNode -> For some reason couldn't find the parent... check me pls");
		}
		handleEl.setPointerCapture(e.pointerId);
		handleEl.addEventListener('pointermove', handlePointerMove);
		handleEl.addEventListener('pointerup', handlePointerUp);
		handleEl.addEventListener('pointercancel', handlePointerUp);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isResizing) return;
		e.stopPropagation();

		const dx = e.clientX - startX;
		const dy = e.clientY - startY;

		// Scale resize changes by the zoom factor
		const dxZoom = dx / options.getZoom();
		const dyZoom = dy / options.getZoom();

		let newWidth = startWidth + dxZoom;
		let newHeight = startHeight + dyZoom;

		if (options.node.keepAspectRatio) {
			// ponytail: keep initial aspect ratio on resize, accounting for larger cursor shift
			const scaleX = (startWidth + dxZoom) / startWidth;
			const scaleY = (startHeight + dyZoom) / startHeight;
			const scale = Math.abs(dxZoom) > Math.abs(dyZoom) ? scaleX : scaleY;

			let targetWidth = startWidth * scale;
			let targetHeight = startHeight * scale;

			// Handle clamping while maintaining aspect ratio
			if (targetWidth < minWidth) {
				targetWidth = minWidth;
				targetHeight = targetWidth / startAspectRatio;
			} else if (targetWidth > maxWidth) {
				targetWidth = maxWidth;
				targetHeight = targetWidth / startAspectRatio;
			}

			if (targetHeight < minHeight) {
				targetHeight = minHeight;
				targetWidth = targetHeight * startAspectRatio;
			} else if (targetHeight > maxHeight) {
				targetHeight = maxHeight;
				targetWidth = targetHeight * startAspectRatio;
			}

			newWidth = targetWidth;
			newHeight = targetHeight;
		} else {
			// Normal clamp based on computed styles of the child widget
			newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
			newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
		}

		options.node.width = newWidth;
		options.node.height = newHeight;
	}

	function handlePointerUp(e: PointerEvent) {
		if (!isResizing) return;
		isResizing = false;

		try {
			handleEl.releasePointerCapture(e.pointerId);
		} catch (_err) {}

		handleEl.removeEventListener('pointermove', handlePointerMove);
		handleEl.removeEventListener('pointerup', handlePointerUp);
		handleEl.removeEventListener('pointercancel', handlePointerUp);

		options.triggerChange();
	}

	handleEl.addEventListener('pointerdown', handlePointerDown);

	// Explicitly block mousedown & touchstart propagation to prevent panning & dragging node
	const block = (e: Event) => e.stopPropagation();
	handleEl.addEventListener('mousedown', block);
	handleEl.addEventListener('touchstart', block);

	return {
		update(newOptions: ResizeOptions) {
			options = newOptions;
		},
		destroy() {
			handleEl.removeEventListener('pointerdown', handlePointerDown);
			handleEl.removeEventListener('mousedown', block);
			handleEl.removeEventListener('touchstart', block);
		},
	};
}

/**
 * Svelte Action using ResizeObserver to measure and bind node dimensions.
 * Skips the first observation callback if the node already has saved
 * dimensions (i.e. was deserialized), so we don't overwrite persisted
 * width/height before the wrapper's explicit style has been applied.
 */
export function observeSize(nodeEl: HTMLElement, initialOptions: ObserveSizeOptions) {
	let options = initialOptions;
	const targetEl = (nodeEl.firstElementChild as HTMLElement) || nodeEl;

	// If the node already has saved dimensions, skip the very first
	// ResizeObserver callback to avoid clobbering them with raw DOM
	// measurements taken before the wrapper style has been applied.
	let skipFirst = options.node.width !== undefined && options.node.height !== undefined;

	const observer = new ResizeObserver((entries) => {
		if (skipFirst) {
			skipFirst = false;
			return;
		}
		for (const entry of entries) {
			const width = entry.borderBoxSize?.[0]?.inlineSize ?? targetEl.offsetWidth;
			const height = entry.borderBoxSize?.[0]?.blockSize ?? targetEl.offsetHeight;

			if (options.node.width !== width || options.node.height !== height) {
				options.node.width = width;
				options.node.height = height;
				options.triggerChange();
			}
		}
	});

	observer.observe(targetEl);
	return {
		update(newOptions: ObserveSizeOptions) {
			options = newOptions;
			// Reset skipFirst — the new node may or may not have saved dimensions
			skipFirst = newOptions.node.width !== undefined && newOptions.node.height !== undefined;
		},
		destroy() {
			observer.disconnect();
		},
	};
}
