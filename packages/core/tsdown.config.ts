import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  outDir: "./dist",
  format: ["esm"],
  target: false,
  sourcemap: true,
  platform: "neutral",
  external: ["lightningcss"],
});
