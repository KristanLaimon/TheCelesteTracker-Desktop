import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import svelte from "@astrojs/svelte";
import Icons from "unplugin-icons/vite";

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  outDir: "./dist",

  vite: {
    plugins: [
      //@ts-expect-error aaa
      tailwindcss(),
      //@ts-expect-error aaa
      Icons({
        compiler: "svelte",
      }),
    ],
    server: {
      warmup: {
        clientFiles: [
          "./src/pages/**/*.astro",
          "./src/layouts/**/*.astro",
          "./src/components/**/*.astro",
          "./src/components/**/*.svelte",
        ],
      },
      watch: {
        usePolling: true,
        interval: 100,
        ignored: [
          "**/target/**",
          "**/dist/**",
          "**/.astro/**",
          "**/.git/**",
        ],
      },
    },

    optimizeDeps: {
      include: ["@astrojs/svelte/client.js", "svelte", "gsap"],
    },
  },

  integrations: [svelte()],
});
