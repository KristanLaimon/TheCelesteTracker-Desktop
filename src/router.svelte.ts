import type { Component } from 'svelte';

export interface Route {
	pattern: string;
	component: Component;
}

const STORAGE_KEY = 'last_page';

function getInitialUrl(): URL {
	const currentUrl = new URL(window.location.href);
	try {
		const lastPage = localStorage.getItem(STORAGE_KEY);
		if (lastPage) {
			const savedUrl = new URL(lastPage, window.location.href);
			if (savedUrl.href !== currentUrl.href) {
				window.history.replaceState({}, '', savedUrl.href);
			}
			return savedUrl;
		}
		// If no last page is stored, store the current one
		localStorage.setItem(STORAGE_KEY, currentUrl.pathname + currentUrl.search + currentUrl.hash);
	} catch (e) {
		console.error('Failed to get or set initial URL in localStorage:', e);
	}
	return currentUrl;
}

class Router {
	public url = $state(getInitialUrl());
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
					component: route.component,
				};
			}
		}

		return {
			path,
			params: {} as Record<string, string>,
			query,
			hash,
			// biome-ignore lint/suspicious/noExplicitAny: compatibility type
			component: null as any,
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

	private saveLastPage(url: URL) {
		localStorage.setItem(STORAGE_KEY, url.pathname + url.search + url.hash);
	}

	navigate(href: string, options: { replace?: boolean } = {}) {
		const newUrl = new URL(href, window.location.href);
		if (options.replace) {
			window.history.replaceState({}, '', href);
		} else {
			window.history.pushState({}, '', href);
		}
		this.url = newUrl;
		this.scrollToHash(newUrl.hash);
		this.saveLastPage(newUrl);
	}

	// Svelte action to intercept anchor clicks and route client-side
	link = (node: HTMLAnchorElement) => {
		const click = (event: MouseEvent) => {
			if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey || node.target) {
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
		window.addEventListener('popstate', () => {
			const currentUrl = new URL(window.location.href);
			this.url = currentUrl;
			this.scrollToHash(currentUrl.hash);
			this.saveLastPage(currentUrl);
		});
		this.scrollToHash(this.url.hash);
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
