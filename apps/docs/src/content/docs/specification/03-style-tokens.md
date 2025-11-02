---
title: "Style Tokens"
description: "W3C Design Tokens Format alignment with primitive, semantic, and component-scoped token tiers."
---


## 1. Overview

Style tokens define the visual and interactive properties of components through a hierarchical token system. This specification aligns with the [W3C Design Tokens Format Module (2025.10)](https://www.designtokens.org/tr/drafts/format/) while providing component-specific guidance.

All components SHOULD include style tokens organized across three tiers:

1. **Primitive Tokens** — Foundational design values (colors, spacing, typography)
2. **Semantic Tokens** — Intent-based aliases mapping to primitives (primary, success, error)
3. **Component-Scoped Tokens** — Component-specific overrides and variations

**Cross-references:**
- Declared in [Component Metadata](/pencel/specification/02-component-metadata) via `styleTokens` property
- Applied dynamically via [State Machine](/pencel/specification/04-state-machine) `styleMap` (states → token names)
- Organized per [W3C Design Tokens Format Module](https://www.designtokens.org/tr/drafts/format/) §6 (Groups), §7 (Aliases), §8–9 (Types)

## 2. Token Structure

Tokens follow the W3C format with the following structure:

```json
{
  "tokenName": {
    "$type": "color | dimension | fontFamily | fontWeight | duration | cubicBezier | number | typography | shadow | border | gradient | transition | strokeStyle",
    "$value": "...",
    "$description": "Optional human-readable purpose",
    "$deprecated": false
  }
}
```

### 2.1 Supported Token Types

The following token types are REQUIRED to be supported by conforming schema compilers:

| Type | Purpose | Example |
| --- | --- | --- |
| `color` | Visual colors (primitive and semantic) | `{ "colorSpace": "srgb", "components": [0, 0.4, 0.8], "hex": "#0066cc" }` |
| `dimension` | Spatial measurements (spacing, sizing) | `{ "value": 16, "unit": "px" }` |
| `fontFamily` | Typeface selections | `"Roboto"` or `["Helvetica", "Arial"]` |
| `fontWeight` | Font weight (100–900) | `700` or `"bold"` |
| `duration` | Animation/transition timing | `{ "value": 200, "unit": "ms" }` |
| `cubicBezier` | Animation easing curves | `[0.25, 0.1, 0.25, 1]` |
| `number` | Unitless numeric values | `1.5` (e.g., line-height) |
| `typography` | Composite typographic styles | `{ "fontFamily": "...", "fontSize": {...}, "fontWeight": ..., "letterSpacing": {...}, "lineHeight": 1.5 }` |
| `shadow` | Drop/inner shadows | `{ "color": {...}, "offsetX": {...}, "offsetY": {...}, "blur": {...}, "spread": {...}, "inset": false }` |
| `border` | Border styles | `{ "color": {...}, "width": {...}, "style": "..." }` |
| `gradient` | Color gradients | `[{ "color": {...}, "position": 0 }, ...]` |
| `transition` | Animation parameters | `{ "duration": {...}, "delay": {...}, "timingFunction": [...] }` |
| `strokeStyle` | Line/stroke patterns | `"solid"` or `{ "dashArray": [...], "lineCap": "round" }` |

## 3. Three-Tier Token System

### 3.1 Primitive Tokens

Primitive tokens represent atomic, platform-independent design values. These are the foundation upon which all other tokens build.

```json
{
  "primitive": {
    "$type": "color",
    "black": {
      "$value": { "colorSpace": "srgb", "components": [0, 0, 0], "hex": "#000000" }
    },
    "white": {
      "$value": { "colorSpace": "srgb", "components": [1, 1, 1], "hex": "#ffffff" }
    },
    "blue-050": {
      "$value": { "colorSpace": "srgb", "components": [0.933, 0.949, 0.969], "hex": "#eef2f7" }
    },
    "blue-500": {
      "$value": { "colorSpace": "srgb", "components": [0, 0.4, 0.8], "hex": "#0066cc" }
    }
  },
  "spacing": {
    "$type": "dimension",
    "base": {
      "$value": { "value": 16, "unit": "px" }
    },
    "xs": {
      "$value": { "value": 4, "unit": "px" }
    },
    "sm": {
      "$value": { "value": 8, "unit": "px" }
    },
    "md": {
      "$value": { "value": 16, "unit": "px" }
    },
    "lg": {
      "$value": { "value": 32, "unit": "px" }
    }
  },
  "font": {
    "family": {
      "$type": "fontFamily",
      "sans": { "$value": ["Roboto", "Helvetica", "Arial", "sans-serif"] },
      "serif": { "$value": ["Georgia", "serif"] },
      "mono": { "$value": ["Courier New", "monospace"] }
    },
    "weight": {
      "$type": "fontWeight",
      "light": { "$value": 300 },
      "normal": { "$value": 400 },
      "bold": { "$value": 700 }
    }
  }
}
```

**Characteristics:**

- Platform-agnostic, concrete values
- No semantic meaning assigned
- Organized by property type (color, spacing, typography)
- Serve as the source of truth for visual design

### 3.2 Semantic Tokens

Semantic tokens assign meaning to primitive values through naming conventions. They map intent (e.g., "primary action", "error state") to specific primitive tokens, enabling theme switching and platform-specific variations.

```json
{
  "semantic": {
    "color": {
      "$description": "Semantic color tokens mapped to primitives and context",
      "surface": {
        "$value": "{primitive.color.white}",
        "$description": "Default background surface"
      },
      "surface-secondary": {
        "$value": "{primitive.color.blue-050}",
        "$description": "Secondary background layer"
      },
      "primary": {
        "$value": "{primitive.color.blue-500}",
        "$description": "Primary action and interactive states"
      },
      "primary-hover": {
        "$value": "{primitive.color.blue-600}",
        "$description": "Primary action in hover state"
      },
      "primary-active": {
        "$value": "{primitive.color.blue-700}",
        "$description": "Primary action in active/pressed state"
      },
      "text": {
        "$value": "{primitive.color.black}",
        "$description": "Primary text color"
      },
      "text-secondary": {
        "$value": "{primitive.color.gray-600}",
        "$description": "Secondary text (hints, placeholders)"
      },
      "feedback-success": {
        "$value": "{primitive.color.green-600}",
        "$description": "Success/positive feedback"
      },
      "feedback-error": {
        "$value": "{primitive.color.red-600}",
        "$description": "Error/negative feedback"
      },
      "feedback-warning": {
        "$value": "{primitive.color.amber-600}",
        "$description": "Warning/caution feedback"
      }
    },
    "spacing": {
      "$description": "Semantic spacing for consistent layouts",
      "xs": { "$value": "{primitive.spacing.xs}" },
      "sm": { "$value": "{primitive.spacing.sm}" },
      "md": { "$value": "{primitive.spacing.md}" },
      "lg": { "$value": "{primitive.spacing.lg}" },
      "padding-block": { "$value": "{semantic.spacing.md}" },
      "padding-inline": { "$value": "{semantic.spacing.lg}" },
      "gap": { "$value": "{semantic.spacing.md}" }
    }
  }
}
```

**Characteristics:**

- Reference primitive tokens via aliases (`{primitive.token}`)
- Provide semantic naming for intent (primary, success, error)
- Enable theme variations (light/dark mode)
- Support platform-specific overrides
- Document purpose via `$description`

### 3.3 Component-Scoped Tokens

Component-scoped tokens define component-specific styling that may override or extend semantic tokens. These tokens are declared within the component's `styleTokens` section.

```json
{
  "name": "Button",
  "styleTokens": [
    {
      "name": "button-primary-bg",
      "$type": "color",
      "$value": "{semantic.color.primary}",
      "$description": "Primary button background"
    },
    {
      "name": "button-primary-bg-hover",
      "$type": "color",
      "$value": "{semantic.color.primary-hover}",
      "$description": "Primary button background on hover"
    },
    {
      "name": "button-primary-text",
      "$type": "color",
      "$value": "{semantic.color.white}",
      "$description": "Primary button text color"
    },
    {
      "name": "button-padding-vertical",
      "$type": "dimension",
      "$value": "{semantic.spacing.sm}",
      "$description": "Vertical padding for button content"
    },
    {
      "name": "button-padding-horizontal",
      "$type": "dimension",
      "$value": "{semantic.spacing.md}",
      "$description": "Horizontal padding for button content"
    },
    {
      "name": "button-border-radius",
      "$type": "dimension",
      "$value": { "value": 4, "unit": "px" },
      "$description": "Button corner radius"
    },
    {
      "name": "button-transition",
      "$type": "transition",
      "$value": {
        "duration": { "value": 200, "unit": "ms" },
        "delay": { "value": 0, "unit": "ms" },
        "timingFunction": [0.25, 0.1, 0.25, 1]
      },
      "$description": "Smooth transition for state changes"
    }
  ]
}
```

**Characteristics:**

- Prefixed with component name (e.g., `button-*`)
- May reference semantic or primitive tokens
- Can have component-specific values (e.g., border-radius)
- Support platform-specific variations
- Enable variant styling (primary, secondary, ghost)

## 4. Token Resolution

Token resolution follows W3C conventions with the following precedence:

1. **Explicit token value** — Direct `$value` property
2. **Token alias** — `{semantic.token}` or `{primitive.token}` reference
3. **Inherited type** — From parent group's `$type`
4. **Invalid** — No type determinable; tools MUST report error

### 4.1 Alias Resolution Example

```json
{
  "primitive": {
    "color": {
      "blue-500": {
        "$type": "color",
        "$value": { "colorSpace": "srgb", "components": [0, 0.4, 0.8], "hex": "#0066cc" }
      }
    }
  },
  "semantic": {
    "color": {
      "primary": {
        "$type": "color",
        "$value": "{primitive.color.blue-500}"
      },
      "link": {
        "$type": "color",
        "$value": "{semantic.color.primary}"
      }
    }
  }
}
```

Resolution chain: `{semantic.color.link}` → `{semantic.color.primary}` → `{primitive.color.blue-500}` → resolved color value

## 5. Platform-Specific Overrides

Tokens support platform-specific variations via extensions (per W3C spec):

```json
{
  "semantic": {
    "color": {
      "surface": {
        "$type": "color",
        "$value": { "colorSpace": "srgb", "components": [1, 1, 1], "hex": "#ffffff" },
        "$extensions": {
          "com.pencel.platforms": {
            "web": { "$value": { "colorSpace": "srgb", "components": [1, 1, 1], "hex": "#ffffff" } },
            "native": { "$value": { "colorSpace": "srgb", "components": [0.98, 0.98, 0.98] } },
            "xaml": { "$value": "SystemColors.WindowBrush" }
          }
        }
      }
    }
  }
}
```

## 6. Reference Implementation: Panda CSS

**Panda CSS** serves as an exemplary implementation of this token system. It demonstrates:

1. **Hierarchical organization** — Primitive → Semantic → Component tokens
2. **W3C alignment** — Follows Design Tokens format conventions
3. **Type safety** — Enforced token types at configuration and usage
4. **Theme switching** — Supports multiple themes via semantic token overrides
5. **Platform variants** — Generates platform-specific CSS, JSS, styled-components, etc.

### 6.1 Panda Configuration Example

```typescript
// panda.config.ts (exemplary structure aligned with W3C format)
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  theme: {
    tokens: {
      // Primitive tokens
      colors: {
        "black": { value: "#000000" },
        "white": { value: "#ffffff" },
        "blue-500": { value: "#0066cc" },
      },
      spacing: {
        "xs": { value: "4px" },
        "sm": { value: "8px" },
        "md": { value: "16px" },
        "lg": { value: "32px" },
      },
      // Semantic tokens
      colorScheme: {
        "surface": { value: "{colors.white}" },
        "primary": { value: "{colors.blue-500}" },
        "text": { value: "{colors.black}" },
        "feedback-success": { value: "#00cc66" },
        "feedback-error": { value: "#cc0000" },
      },
    },
    // Component-scoped tokens via recipes
    recipes: {
      button: {
        base: {
          bg: "{colorScheme.primary}",
          color: "{colorScheme.white}",
          px: "{spacing.md}",
          py: "{spacing.sm}",
          borderRadius: "4px",
          transition: "200ms ease-in-out",
        },
        variants: {
          variant: {
            primary: {
              bg: "{colorScheme.primary}",
            },
            secondary: {
              bg: "{colorScheme.surface}",
              color: "{colorScheme.text}",
            },
          },
        },
      },
    },
  },
});
```

### 6.2 Key Panda CSS Features Exemplifying W3C Standards

| Feature | W3C Parallel | Benefit |
| --- | --- | --- |
| Token grouping (colors, spacing) | Groups in Design Tokens format | Organized hierarchy |
| Type enforcement (`colors`, `spacing`, etc.) | `$type` property | Ensures correctness |
| Reference aliases (`{colors.blue}`) | Alias/reference syntax | Maintainability |
| Theme variants | Extension properties | Multi-theme support |
| Semantic naming | Semantic tokens tier | Intent clarity |
| Component recipes | Component-scoped tokens | Reusable styling patterns |

## 7. Conformance

A conforming style token set MUST:

1. Adhere to W3C Design Tokens Format Module 2025.10
2. Declare `$type` for all tokens (required or inherited from group)
3. Organize tokens into at least two tiers (primitive, semantic)
4. Support token aliases via `{path.to.token}` syntax
5. Validate all `$value` properties against their declared type
6. Detect and report circular references
7. Support platform-specific overrides via `$extensions`

## 8. References

- [W3C Design Tokens Format Module (2025.10)](https://www.designtokens.org/tr/drafts/format/)
- [Panda CSS Documentation](https://panda-css.com/)
- [Style Dictionary (Amazon)](https://amzn.github.io/style-dictionary/)
- [Token Taxonomy Guidance](https://www.designtokens.org/glossary/)
