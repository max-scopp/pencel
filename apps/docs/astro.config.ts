import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import mermaid from "astro-mermaid";
import starlightLinksValidator from "starlight-links-validator";
import starlightThemeNext from "starlight-theme-next";
import starlightTypeDoc, {
  type StarlightTypeDocOptions,
  typeDocSidebarGroup,
} from "starlight-typedoc";

const typeDoc: StarlightTypeDocOptions["typeDoc"] = {
  excludeNotDocumented: true,
  excludePrivateClassFields: true,
  excludeReferences: true,
  excludeTags: ["@internal"],
  excludePrivate: true,
  excludeProtected: true,
  excludeInternal: true,
  excludeExternals: true,
  includeHierarchySummary: true,
};

// https://astro.build/config
export default defineConfig({
  site: "https://maxscopp.de/pencel/",
  base: "/pencel",
  integrations: [
    mermaid({}),
    starlight({
      title: "✏️ Pencel",
      plugins: [
        starlightThemeNext(),
        starlightLinksValidator(),
        starlightTypeDoc({
          entryPoints: [
            "../../packages/runtime/src/index.ts",
            "../../packages/core/src/index.ts",
            "../../packages/cli/src/index.ts",
          ],
          tsconfig: "./tsconfig.api.json",
          sidebar: {
            collapsed: true,
            label: "API Reference",
          },
          typeDoc,
        }),
      ],
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
        typeDocSidebarGroup,
      ],
    }),
  ],
});
