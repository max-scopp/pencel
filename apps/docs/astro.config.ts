import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import mermaid from "astro-mermaid";
import starlightThemeNext from "starlight-theme-next";

// https://astro.build/config
export default defineConfig({
  site: "https://maxscopp.de/pencel/",
  base: "/pencel",
  integrations: [
    mermaid({}),
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
              label: "Runtime API",
              slug: "runtime",
            },
            {
              label: "Outputs",
              slug: "outputs",
            },
            {
              label: "Roadmap",
              slug: "roadmap",
            },
          ],
        },
        {
          label: "Plugins",
          collapsed: true,
          autogenerate: {
            directory: "plugins",
          },
        },
        {
          label: "Outputs",
          collapsed: true,
          autogenerate: {
            directory: "outputs",
          },
        },
        {
          label: "Guides",
          collapsed: true,
          autogenerate: {
            directory: "guides",
          },
        },
        {
          label: "Best Practices",
          collapsed: true,
          autogenerate: {
            directory: "best-practices",
          },
        },
        {
          label: "Internals",
          collapsed: true,
          autogenerate: {
            directory: "internals",
          },
        },
      ],
    }),
  ],
});
