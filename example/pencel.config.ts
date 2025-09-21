import { defineConfig, type PencelConfig } from "@pencel/cli";

const config: PencelConfig = defineConfig({
  // input: "src/**/*.ts",
  output: {
    mode: "folder",
    path: "src/out/",
  },
  plugins: [
    {
      name: "scss",
      options: {
        enabled: true,
      },
    },
  ],
});

export default config;
