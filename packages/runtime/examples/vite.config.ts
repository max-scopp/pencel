import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
  base: "/",
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        basic: "01-basic/index.html",
        "custom-elements": "02-custom-elements/index.html",
        functional: "03-functional-components/index.html",
        complex: "04-complex/index.html",
      },
    },
  },
});
