import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: true, placement: "bottom-left" },
  outDir: "./dist",

  vite: {
    //@ts-expect-error aaa
    plugins: [tailwindcss()],
    server: {
      warmup: {
        clientFiles: ["./src/pages/**/*.astro", "./src/layouts/**/*.astro", "./src/components/**/*.astro"],
      },
      watch: {
        usePolling: true,
        interval: 100,
        ignored: ["**/src-tauri/**", "**/target/**", "**/dist/**", "**/.astro/**", "**/.git/**"],
      },
    },

    optimizeDeps: {
      include: ["astro"],
    },
  },

  integrations: [svelte()],

});