import type { Component, ComponentProps, Snippet } from 'svelte';

/**
 * Tailwind CSS class names for styling specific parts of the Canvas component.
 */
export interface CanvasClassNames {
	/** Custom CSS classes for the outer wrapper container. */
	wrapper?: string;
	/** Custom CSS classes for the inner transformed content container. */
	content?: string;
	/** Custom CSS classes for the floating controls bar. */
	controls?: string;
	/** Custom CSS classes for the control buttons (Zoom In, Zoom Out, Reset). */
	controlButton?: string;
	/** Custom CSS classes for the zoom level percentage readout. */
	zoomValue?: string;
}

/**
 * Interface that all components rendered on the canvas should satisfy
 * to support updating their internal properties reactively.
 */
export type ICanvasWidgetProps<T = Record<string, unknown>> = IRawInternalCanvasWidgetPropsHelper<T> & T;
interface IRawInternalCanvasWidgetPropsHelper<T = Record<string, unknown>> {
	onChange?: (updatedProps: T) => void;
}

/**
 * Persistence configuration and callbacks for the Canvas component.
 */
export interface CanvasPersistence {
	/** The localStorage key under which nodes are saved/loaded. */
	key: string;
	/** Callback fired before the canvas saves state. Call cancel() to abort. */
	beforeSave?: (nodes: CanvasNodeData<any>[], cancel: () => void) => void;
	/** Callback fired after the canvas state is saved. */
	afterSave?: (nodes: CanvasNodeData<any>[]) => void;
}

/**
 * Structural definition of a node on the canvas workspace.
 */
export type CanvasNodeData<C extends Component<any, any, any> = Component<any, any, any>> = {
	/** Unique identifier for the node. If not specified, Canvas will automatically generate a unique UUID. */
	id?: string;
	/** Direct Svelte component class to render for this node. */
	componentSvelte: C;
	/** Custom props passed to the direct component. */
	componentProps?: ComponentProps<C>;
	/** Horizontal position of the node in the canvas world space. */
	x: number;
	/** Vertical position of the node in the canvas world space. */
	y: number;
	/** Measured width of the node. */
	width?: number;
	/** Measured height of the node. */
	height?: number;
	/** Whether the node is pinned in place on the canvas. */
	isPinned?: boolean;
	/** Whether to keep the initial aspect ratio when resizing. */
	keepAspectRatio?: boolean;
	/** The layer index of the node (positive integers only). */
	layer?: number;
	// biome-ignore lint/suspicious/noExplicitAny: Needed to support custom configuration fields
	[key: string]: any;
};

/**
 * Props definition for the Canvas library component.
 */
export interface CanvasProps {
	x?: number;
	y?: number;
	zoom?: number;
	minZoom?: number;
	maxZoom?: number;
	zoomSpeed?: number;
	infinite?: boolean;
	limitXMin?: number;
	limitXMax?: number;
	limitYMin?: number;
	limitYMax?: number;
	showControls?: boolean;
	resizable?: boolean;
	nodes?: CanvasNodeData<any>[];
	dragHandleClass?: string;
	onNodeChange?: (nodes: CanvasNodeData<any>[]) => void;
	classNames?: CanvasClassNames;
	class?: string;
	style?: string;
	bgColor?: string;
	dotColor?: string;
	dotSize?: number;
	showDots?: boolean;
	mode?: 'normal' | 'zen';
	children?: Snippet;
	controls?: Snippet;
	persistence?: CanvasPersistence | null;
	wrapperEl?: HTMLDivElement | null;
}
