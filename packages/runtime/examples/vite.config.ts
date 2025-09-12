import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
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
        index: "index.html",
        basic: "01-basic/index.html",
        "custom-elements": "02-custom-elements/index.html",
        functional: "03-functional-components/index.html",
        complex: "04-complex/index.html",
        test: "test-multiple-renders.html",
      },
    },
  },
});
