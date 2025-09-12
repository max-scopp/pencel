import dts from "bun-plugin-dts";

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  format: "esm",
  target: "browser",
  minify: true,
  sourcemap: true,
  plugins: [
    dts({
      output: {
        noBanner: true,
      },
    }),
  ],
});
