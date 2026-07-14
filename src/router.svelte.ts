import type { Component } from 'svelte';

export interface Route {
  pattern: string;
  component: Component;
}

class Router {
  public url = $state(new URL(window.location.href));
  public routes = $state<Route[]>([]);

  page = $derived.by(() => {
    const path = this.url.pathname;
    const query = Object.fromEntries(this.url.searchParams.entries());
    const hash = this.url.hash;

    for (const route of this.routes) {
      const params = matchRoute(route.pattern, path);
      if (params !== null) {
        return {
          path,
          params,
          query,
          hash,
          component: route.component as Component,
        };
      }
    }

    return {
      path,
      params: {} as Record<string, string>,
      query,
      hash,
      component: null as Component | null,
    };
  });

  register(newRoutes: Route[]) {
    this.routes = newRoutes;
  }

  scrollToHash(hash: string) {
    if (!hash) return;
    setTimeout(() => {
      const id = decodeURIComponent(hash.slice(1));
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 0);
  }

  navigate(href: string, options: { replace?: boolean } = {}) {
    if (typeof window === 'undefined') return;
    const newUrl = new URL(href, window.location.href);
    if (options.replace) {
      window.history.replaceState({}, '', href);
    } else {
      window.history.pushState({}, '', href);
    }
    this.url = newUrl;
    this.scrollToHash(newUrl.hash);
  }

  // Svelte action to intercept anchor clicks and route client-side
  link = (node: HTMLAnchorElement) => {
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey ||
        node.target
      ) {
        return;
      }

      const targetUrl = new URL(node.href, window.location.href);
      if (targetUrl.origin !== window.location.origin) {
        return; // let external links proceed normally
      }

      event.preventDefault();
      this.navigate(targetUrl.pathname + targetUrl.search + targetUrl.hash);
    };

    node.addEventListener('click', click);
    return {
      destroy() {
        node.removeEventListener('click', click);
      },
    };
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        this.url = new URL(window.location.href);
        this.scrollToHash(this.url.hash);
      });
      this.scrollToHash(window.location.hash);
    }
  }
}

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const keys: string[] = [];
  const regexStr = pattern
    .replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    })
    .replace(/\*/g, '.*');

  const regex = new RegExp(`^${regexStr}$`);
  const match = path.match(regex);
  if (!match) return null;

  const params: Record<string, string> = {};
  keys.forEach((key, index) => {
    params[key] = decodeURIComponent(match[index + 1] || '');
  });
  return params;
}

export const router = new Router();
