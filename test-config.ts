import { defineConfig } from "./packages/cli/src";

const config = defineConfig({
  compiler: {
    target: "es2022",
    experimentalDecorators: true,
  },
  output: {
    dir: "dist",
    format: "esm",
  },
});

console.log("Config created successfully:", config);
