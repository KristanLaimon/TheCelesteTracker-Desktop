// UNIVERSAL COMPATIBILITY
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

/**
 * Mirrors `compilerOptions.paths` in tsconfig.json — Vite does not read those on its own.
 *
 * Applies to `.ts` and asset imports only: a `.svelte` file imported through an alias makes
 * vite-plugin-svelte miss its compiled-CSS cache, so `@tailwindcss/vite` then parses the raw
 * component source as CSS and the build dies with `CssSyntaxError`. Import components relatively.
 */
const aliases = {
	"@core": "./src/core",
	"@domain": "./src/domain",
	"@api": "./src/api",
	"@db": "./src/db",
	"@utils": "./src/utils",
	"@libs": "./src/libs",
	"@pages": "./src/pages",
	"@components": "./src/components",
	"@layouts": "./src/layouts",
	"@assets": "./src/assets",
	"@go": "./src-utils",
};

// Custom plugin to ensure production build uses the relative Neutralino globals path
/*
function _neutralinoBuildPlugin() {
  return {
    name: 'neutralino-build-plugin',
    transformIndexHtml(html: string) {
      return html.replace(
        /src=["']http:\/\/localhost:\d+\/__neutralino_globals\.js["']/,
        'src="/__neutralino_globals.js"',
      );
    },
  };
}
*/

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tailwindcss(),
		svelte(),
		// neutralinoBuildPlugin(),
	],
	resolve: {
		alias: Object.fromEntries(Object.entries(aliases).map(([key, dir]) => [key, fileURLToPath(new URL(dir, import.meta.url)).replace(/\\/g, "/")])),
	},
	build: {
		outDir: "dist/vite-temp-build",
		emptyOutDir: true,
	},
});
