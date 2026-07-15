import type { GoldenLayout, LayoutManager } from 'golden-layout';
import { type Component, mount, unmount } from 'svelte';

export class GoldenLayoutWrapper {
  private svelteComponentCounter = 0;

  constructor(private readonly rawLayout: GoldenLayout) {
    if (!rawLayout) {
      throw new Error('GoldenLayout instance is mandatory for GoldenLayoutWrapper injection.');
    }
  }

  /**
   * Retrieves the raw GoldenLayout instance.
   */
  get raw(): GoldenLayout {
    return this.rawLayout;
  }

  /**
   * Dynamically registers a Svelte component class and returns its unique registered type name.
   */
  private registerDynamicSvelteComponent(component: Component<Record<string, unknown>>): string {
    this.svelteComponentCounter++;
    const uniqueTypeName = `dyn_svelte_comp_${this.svelteComponentCounter}`;

    this.rawLayout.registerComponentFactoryFunction(uniqueTypeName, (container, state) => {
      const componentInstance = mount(component, {
        target: container.element,
        props: (state as Record<string, unknown>) || {},
      });

      container.on('destroy', () => {
        unmount(componentInstance);
      });
    });

    return uniqueTypeName;
  }

  /**
   * Dynamically adds a Svelte component as a tab.
   * Registers the Svelte component dynamically under a unique ID.
   */
  addSvelteTab(component: Component<Record<string, unknown>>, props: Record<string, unknown> = {}, title: string = 'New Tab'): void {
    const typeName = this.registerDynamicSvelteComponent(component);
    this.rawLayout.addComponent(typeName, props, title);
  }

  /**
   * Dynamically adds a Svelte component at a specific location selector.
   * Registers the Svelte component dynamically under a unique ID.
   */
  addSvelteTabAtLocation(
    component: Component<Record<string, unknown>>,
    props: Record<string, unknown> = {},
    title: string,
    locationSelectors: LayoutManager.LocationSelector[],
  ): void {
    const typeName = this.registerDynamicSvelteComponent(component);
    this.rawLayout.addComponentAtLocation(typeName, props, title, locationSelectors);
  }
}
