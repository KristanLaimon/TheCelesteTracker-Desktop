import type { Component, Snippet } from 'svelte';

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

// biome-ignore lint/suspicious/noExplicitAny: generic component parameters require any
export type CanvasRegistry = Record<string, Component<any, any, any>>;

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
export interface CanvasPersistence<Registry extends CanvasRegistry = CanvasRegistry> {
	/** The localStorage key under which nodes are saved/loaded. */
	key: string;
	/** Callback fired before the canvas saves state. Call cancel() to abort. */
	beforeSave?: (nodes: CanvasNodeData<Registry>[], cancel: () => void) => void;
	/** Callback fired after the canvas state is saved. */
	afterSave?: (nodes: CanvasNodeData<Registry>[]) => void;
}

// Helper to determine the required keys of a Svelte component's props interface
type RequiredKeys<T> = {
	// biome-ignore lint/complexity/noBannedTypes: `{}` is the canonical TS idiom for "optional property" detection in mapped types
	[K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

// Helper that makes the 'props' property mandatory ONLY if the Svelte component has required props
type NodeProps<P> = [RequiredKeys<P>] extends [never] ? { props?: P } : { props: P };

/**
 * Structural definition of a node on the canvas workspace.
 */
export type CanvasNodeData<Registry extends CanvasRegistry = CanvasRegistry> =
	| {
			[K in keyof Registry & string]: {
				/** Unique identifier for the node. If not specified, Canvas will automatically generate a unique UUID. */
				id?: string;
				/** Registered component type to render. Must match a key in the registry object. */
				type: K;
				/** Direct Svelte component is not allowed when using registry mapping. */
				component?: never;
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
			} & NodeProps<Registry[K] extends Component<infer P> ? P : Record<string, unknown>>;
	  }[keyof Registry & string]
	| {
			/** Unique identifier for the node. If not specified, Canvas will automatically generate a unique UUID. */
			id?: string;
			/** Registry type is not allowed when using direct component reference. */
			type?: never;
			/** Direct Svelte component class to render for this node (non-serializable). */
			component: Component<Record<string, unknown>>;
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
			/** Custom props passed to the direct component. */
			props?: Record<string, unknown>;
	  };

/**
 * Props definition for the Canvas library component.
 */
export interface CanvasProps<Registry extends CanvasRegistry = CanvasRegistry> {
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
	nodes?: CanvasNodeData<Registry>[];
	registry?: Registry;
	dragHandleClass?: string;
	onNodeChange?: (nodes: CanvasNodeData<Registry>[]) => void;
	classNames?: CanvasClassNames;
	class?: string;
	style?: string;
	bgColor?: string;
	dotColor?: string;
	dotSize?: number;
	showDots?: boolean;
	mode?: 'normal' | 'zen';
	children?: Snippet;
	persistence?: CanvasPersistence<Registry> | null;
}
