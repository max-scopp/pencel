import { defineConfig } from "@pencel/cli";

export default defineConfig({
  runtime: {
    tagNamespace: "wb",
  },
  plugins: ["host", "scss", "angular"],
});
