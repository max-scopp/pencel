/// <reference types='vitest' />

import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  const packagesPath = resolve(__dirname, "..", "..", "..", "packages");

  return {
    root: import.meta.dirname,
    cacheDir: "../../../node_modules/.vite/examples/sample/web",
    resolve: {
      alias: {
        "@pencel/utils": resolve(packagesPath, "utils/src"),
        "@pencel/runtime": resolve(packagesPath, "runtime/src"),
        "@pencel/core": resolve(packagesPath, "core/src"),
        "@pencel/cli": resolve(packagesPath, "cli/src"),
      },
    },
    server: {
      port: 4200,
      host: "localhost",
      watch: {
        ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/*.tsbuildinfo"],
      },
    },
    preview: {
      port: 4300,
      host: "localhost",
    },
    plugins: [],
    build: {
      outDir: "./dist",
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  };
});
