import { defineConfig } from "../packages/cli/src/index.ts";

export default defineConfig({
  // input: "src/**/*.ts",
  output: {
    mode: "folder",
    path: "src/out/",
  },
  // plugins: [],
});
