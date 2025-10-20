import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightThemeNext from "starlight-theme-next";

// https://astro.build/config
export default defineConfig({
  site: "https://maxscopp.de/pencel/",
  base: "/pencel",
  integrations: [
    starlight({
      title: "✏️ Pencel",
      plugins: [starlightThemeNext()],
      credits: true,
      customCss: [
        // Relative path to your custom CSS file
        "./src/styles/custom.css",
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/max-scopp/pencel",
        },
      ],
      components: {
        ThemeSelect: "./src/components/ThemeSelect.astro",
      },
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
