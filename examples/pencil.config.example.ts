import { defineConfig } from "../packages/cli/src";

export default defineConfig({
  compiler: {
    target: "es2022",
    experimentalDecorators: true,
  },
  output: {
    dir: "build",
    format: "esm",
  },
  // All @Component decorators will be prefixed with this namespace
  tagNamespace: "my-app-",
});
