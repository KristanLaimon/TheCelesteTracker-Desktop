/**
 * @module CanvasMath
 * @description Pure mathematical helper functions for canvas coordinates, limits, and zooming.
 */

export interface Point {
	x: number;
	y: number;
}

export interface Rect {
	width: number;
	height: number;
	left: number;
	top: number;
}

export interface CanvasLimits {
	minZoom: number;
	maxZoom: number;
	zoomSpeed: number;
	infinite: boolean;
	limitXMin: number;
	limitXMax: number;
	limitYMin: number;
	limitYMax: number;
}

/**
 * Clamp a numeric value between bounds.
 */
export function clamp(val: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, val));
}

/**
 * Clamp horizontal coordinate based on limits.
 */
export function clampX(x: number, limits: CanvasLimits): number {
	return limits.infinite ? x : clamp(x, limits.limitXMin, limits.limitXMax);
}

/**
 * Clamp vertical coordinate based on limits.
 */
export function clampY(y: number, limits: CanvasLimits): number {
	return limits.infinite ? y : clamp(y, limits.limitYMin, limits.limitYMax);
}

/**
 * Calculates new zoom factor clamped to limits.
 */
export function clampZoom(zoom: number, limits: CanvasLimits): number {
	return clamp(zoom, limits.minZoom, limits.maxZoom);
}

/**
 * Calculates viewport offset after zooming relative to a specific anchor point.
 */
export function calculateZoomOffset(anchor: Point, current: Point, ratio: number, limits: CanvasLimits): Point {
	// ponytail: clean zoom offset math
	const nextX = anchor.x - (anchor.x - current.x) * ratio;
	const nextY = anchor.y - (anchor.y - current.y) * ratio;
	return {
		x: clampX(nextX, limits),
		y: clampY(nextY, limits),
	};
}

/**
 * Calculates Euclidean distance between two touches.
 */
export function getTouchDistance(t1: Touch, t2: Touch): number {
	return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}

/**
 * Calculates the center point of two touches relative to a bounding client rectangle.
 */
export function getTouchCenter(t1: Touch, t2: Touch, rect: Rect): Point {
	return {
		x: (t1.clientX + t2.clientX) / 2 - rect.left,
		y: (t1.clientY + t2.clientY) / 2 - rect.top,
	};
}
