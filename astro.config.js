import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: true, placement: "bottom-left" },
  outDir: "./dist",
  vite: {
    server: {
      warmup: {
        clientFiles: ["./src/pages/**/*.astro", "./src/layouts/**/*.astro", "./src/components/**/*.astro"],
      },
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
    optimizeDeps: {
      include: ["astro"],
    },
  },
});
