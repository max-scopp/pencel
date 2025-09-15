import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts", "./src/main.ts"],
  outDir: "./dist",
  format: ["esm"],
  sourcemap: true,
  banner: `/* Pencel CLI v0.0.0 - License: MIT */`,
  platform: "node",
});
