import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightThemeNext from "starlight-theme-next";

// https://astro.build/config
export default defineConfig({
  site: "https://maxscopp.de/pencel/",
  integrations: [
    starlight({
      title: "Pencel",
      plugins: [starlightThemeNext()],
      credits: true,
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/max-scopp/pencel",
        },
      ],
      sidebar: [
        {
          label: "Introduction",
          items: [
            {
              label: "Getting Started",
              slug: "getting-started",
            },
            {
              label: "Configuration",
              slug: "configuration",
            },
            {
              label: "Outputs",
              slug: "outputs",
            },
          ],
        },
        {
          label: "Guides",
          items: [
            // Each item here is one entry in the navigation menu.
            { label: "Example Guide", slug: "guides/example" },
          ],
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
    }),
  ],
});
