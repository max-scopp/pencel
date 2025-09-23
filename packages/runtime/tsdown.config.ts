import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts", "./src/jsx-runtime.tsx"],
  outDir: "./dist",
  format: ["esm"],
  target: false,
  sourcemap: true,
  banner: "/* Pencel Runtime v0.0.0 - License: MIT */",
  minify: true,
  platform: "browser",
});
