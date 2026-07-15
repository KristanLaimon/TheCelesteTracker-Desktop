import type { Component } from 'svelte';

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
 * A registry mapping type strings to Svelte Component classes.
 */
export type CanvasRegistry = Record<string, Component<any, any, any>>;

/**
 * Interface that all components rendered on the canvas should satisfy
 * to support updating their internal properties reactively.
 */
export type ICanvasWidgetProps<T = Record<string, any>> = IRawInternalCanvasWidgetPropsHelper<T> & T;
interface IRawInternalCanvasWidgetPropsHelper<T = Record<string, any>> {
	onChange?: (updatedProps: Partial<T>) => void;
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
	[K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

// Helper that makes the 'props' property mandatory ONLY if the Svelte component has required props
type NodeProps<P> = [RequiredKeys<P>] extends [never] ? { props?: P } : { props: P };

/**
 * Mapped Type representing a single Canvas node.
 * Automatically validates components registered in the canvas's registry,
 * enforcing that props are specified if the component has required parameters.
 */
export type CanvasNodeData<Registry extends CanvasRegistry = CanvasRegistry> =
	| {
			[K in keyof Registry & string]: {
				/** Unique identifier for the node. */
				id: string;
				/** The registered type of Svelte component to render for this node. */
				type: K;
				/** Direct component reference is not allowed when using registry type. */
				component?: never;
				/** Horizontal position of the node in the canvas world space. */
				x: number;
				/** Vertical position of the node in the canvas world space. */
				y: number;
				/** Measured width of the node. */
				width?: number;
				/** Measured height of the node. */
				height?: number;
			} & NodeProps<Registry[K] extends Component<infer P, any, any> ? P : Record<string, any>>;
	  }[keyof Registry & string]
	| {
			/** Unique identifier for the node. */
			id: string;
			/** Registry type is not allowed when using direct component reference. */
			type?: never;
			/** Direct Svelte component class to render for this node (non-serializable). */
			component: Component<any, any, any>;
			/** Horizontal position of the node in the canvas world space. */
			x: number;
			/** Vertical position of the node in the canvas world space. */
			y: number;
			/** Measured width of the node. */
			width?: number;
			/** Measured height of the node. */
			height?: number;
			/** Custom props passed to the direct component. */
			props?: Record<string, any>;
	  };
