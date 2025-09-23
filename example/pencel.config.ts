import { defineConfig, type PencelConfig } from "@pencel/cli";

const config: PencelConfig = defineConfig({
  // input: "src/**/*.ts",
  output: {
    mode: "folder",
    path: "src/out/",
  },
  runtime: {
    tagNamespace: "ion",
  },
  plugins: [
    {
      name: "scss",
      options: {
        enabled: false,
      },
    },
    {
      name: "css",
      options: {
        enabled: false,
      },
    },
  ],
});

export default config;
