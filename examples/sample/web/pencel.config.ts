import { defineConfig } from "@pencel/cli";

export default defineConfig({
  runtime: {
    tagNamespace: "wb",
  },
  plugins: [
    {
      name: "angular",
      options: {},
    },
  ],
});
