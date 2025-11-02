# Component Metadata

## 1. Overview

Component metadata defines the root structure of a universal component. It captures the component's identity, API surface (props), content slots, internal structure, styling requirements, behaviour, and accessibility semantics.

All component IRs MUST conform to the Component Metadata schema defined in this section.

**Cross-references:** This document is the root specification. Refer to:
- [Style Tokens](./03-style-tokens.md) for `styleTokens` details
- [State Machine](./04-state-machine.md) for `stateMachine` details
- [Accessibility](./06-accessibility.md) for `semantics` details
- [Bindings & Data](./07-bindings-and-data.md) for `bindings` details

## 2. Preliminary Component Schema

A component definition is organized into **nine functional domains**. Each domain captures specific aspects of the component's contract and behaviour. The following table provides a quick reference:

| Domain | Purpose | Key Concepts |
| --- | --- | --- |
| **Identity & Metadata** | Component identity and versioning | name, version, description, maturity, platform hints |
| **Public API** | Surface-level input parameters | props, types, required/optional, defaults, mutability |
| **Content Projection** | Named regions for child content | slots, accepted types, optionality |
| **Internal Structure** | Component layout and DOM shape | root element, hierarchy, slot placement, encapsulation |
| **State Management** | Internal reactive properties | state properties, types, defaults, change detection |
| **Interaction & Events** | User actions and notifications | events, detail types, propagation flags, handlers |
| **Styling & Theming** | Visual design and token system | primitive tokens, semantic tokens, component scopes, overrides |
| **Accessibility & Semantics** | Inclusive interaction and meaning | roles, ARIA attributes, keyboard rules, platform mappings |
| **Behaviour Rules** | State transitions and reactions | state machine, transitions, state→style bindings, animations |
| **Data Binding** | Reactive data synchronization | binding direction, source/target paths, transforms, validation |

### 2.1 Domain Breakdown

The following diagram illustrates how these domains compose a complete component definition:

```
┌────────────────────────────────────────────────────────────────────────┐
│                     COMPONENT DEFINITION                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   📋 IDENTITY & METADATA          🎛️ PUBLIC API                       │
│   ├─ Name                         ├─ Property Name                     │
│   ├─ Version                      ├─ Type Definition                   │
│   ├─ Description                  ├─ Required / Optional               │
│   ├─ Maturity                     ├─ Default Value                     │
│   └─ Platform Hints               └─ Reflection / Mutability           │
│                                                                        │
│   📦 CONTENT PROJECTION            🏗️ INTERNAL STRUCTURE                │
│   ├─ Slot Name                    ├─ Root Element                      │
│   ├─ Accepted Types               ├─ Child Hierarchy                   │
│   └─ Optionality                  ├─ Slot Placement                    │
│                                    ├─ Shadow DOM Mode                  │
│                                    └─ Style Scoping                    │
│                                                                        │
│   💾 STATE MANAGEMENT              ⚡ INTERACTION & EVENTS              │
│   ├─ State Property               ├─ Event Name                        │
│   ├─ Type & Default               ├─ Detail Type                       │
│   ├─ Equality Comparator          ├─ Propagation Flags                 │
│   └─ Change Detection             └─ Handler Bindings                  │
│                                                                        │
│   🎨 STYLING & THEMING             ♿ ACCESSIBILITY & SEMANTICS         │
│   ├─ Primitive Tokens             ├─ Semantic Role                     │
│   ├─ Semantic Tokens              ├─ ARIA Attributes                   │
│   ├─ Component Scopes             ├─ Keyboard Interaction              │
│   └─ Platform Overrides           └─ Platform Mappings                 │
│                                                                        │
│   🔄 BEHAVIOUR RULES               🔗 DATA BINDING & REACTIVITY         │
│   ├─ Named States                 ├─ Binding Direction                 │
│   ├─ Transitions & Events         ├─ Source & Target Paths             │
│   ├─ State → Style Maps           ├─ Transform Functions               │
│   └─ Animation / Timing           └─ Validation Rules                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Required Properties

```json
{
  "irVersion": "1.0.0",
  "name": "string",
  "type": "component",
  "props": [],
  "slots": {}
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `irVersion` | string | REQUIRED | Semantic version of the IR spec (e.g., `"1.0.0"`) |
| `name` | string | REQUIRED | Component name; MUST be a valid PascalCase identifier |
| `type` | enum | REQUIRED | MUST be `"component"` |
| `props` | array | REQUIRED | Array of prop definitions (see §2.4) |
| `slots` | object | REQUIRED | Named slot definitions (see §2.5); MAY be empty object `{}` |

### 2.2 Optional Properties

```json
{
  "description": "string",
  "version": "string",
  "maturity": "experimental | stable | deprecated",
  "structure": {},
  "semantics": {},
  "styleTokens": [],
  "stateMachine": {},
  "bindings": []
}
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `description` | string | – | Human-readable component description |
| `version` | string | – | Component version (semantic) |
| `maturity` | enum | `"stable"` | Component API stability level |
| `structure` | object | – | Internal component hierarchy (see §2.6) |
| `semantics` | object | – | Accessibility metadata (see [Accessibility](./06-accessibility.md)) |
| `styleTokens` | array | – | Component-scoped style tokens (see [Style Tokens](./03-style-tokens.md)) |
| `stateMachine` | object | – | Behaviour definition (see [State Machine](./04-state-machine.md)) |
| `bindings` | array | – | Reactive bindings (see [Bindings & Data](./07-bindings-and-data.md)) |

### 2.3 Props Definition

Props declare the public API of a component. Each prop is an object with the following structure:

```json
{
  "name": "string",
  "type": "string | number | boolean | enum | object | array",
  "required": false,
  "default": "any",
  "description": "string"
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | REQUIRED | Prop identifier; MUST be valid camelCase |
| `type` | string \| enum | REQUIRED | Scalar type or reference; see §2.3.1 |
| `required` | boolean | OPTIONAL (default: `false`) | Whether prop is mandatory |
| `default` | any | OPTIONAL | Default value if not provided |
| `description` | string | OPTIONAL | Documentation for the prop |

### 2.3.1 Prop Types

Conforming props MUST use one of the following types:

| Type | Description | Example |
| --- | --- | --- |
| `"string"` | Text value | `"label"` |
| `"number"` | Numeric value | `42`, `3.14` |
| `"boolean"` | Boolean value | `true`, `false` |
| `"enum"` | Fixed set of values; **requires `values` property** | `{ "type": "enum", "values": ["small", "large"] }` |
| `"object"` | Structured object; **requires `schema` property** | `{ "type": "object", "schema": { "x": "number", "y": "number" } }` |
| `"array"` | Array of homogeneous items; **requires `items` property** | `{ "type": "array", "items": "string" }` |

### 2.3.2 Example: Props

```json
{
  "props": [
    {
      "name": "label",
      "type": "string",
      "required": true,
      "description": "Button text label"
    },
    {
      "name": "size",
      "type": "enum",
      "values": ["small", "medium", "large"],
      "default": "medium",
      "description": "Button size variant"
    },
    {
      "name": "disabled",
      "type": "boolean",
      "default": false
    },
    {
      "name": "onClick",
      "type": "object",
      "schema": {
        "handler": "function",
        "args": "array"
      }
    }
  ]
}
```

## 2.4 Slots Definition

Slots define named content regions where child components or content can be projected.

```json
{
  "slots": {
    "slotName": {
      "description": "string",
      "optional": false,
      "accepts": ["component", "text"]
    }
  }
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `description` | string | OPTIONAL | Documentation for the slot |
| `optional` | boolean | OPTIONAL (default: `false`) | Whether slot content is optional |
| `accepts` | array | OPTIONAL (default: `["component", "text"]`) | Content types accepted (e.g., `"component"`, `"text"`, specific component names) |

### 2.4.1 Example: Slots

```json
{
  "slots": {
    "default": {
      "description": "Button content (text or icon)",
      "accepts": ["text", "icon"]
    },
    "before": {
      "description": "Icon or content before label",
      "optional": true
    },
    "after": {
      "description": "Icon or content after label",
      "optional": true
    }
  }
}
```

## 2.5 Internal Structure

The `structure` object defines how slots and internal elements are arranged in the component tree.

```json
{
  "structure": {
    "root": {
      "tag": "button",
      "attributes": {},
      "children": ["slot:default"]
    }
  }
}
```

Nodes in the structure tree use:

- `"tag"` — platform-neutral element (e.g., `"button"`, `"div"`, `"text"`)
- `"attributes"` — element attributes (e.g., `{ "type": "button" }`)
- `"children"` — array of child node keys or slot references (e.g., `["slot:default"]`, `["label"]`)

More details in [Slots & Structure](./05-slots-and-structure.md).

## 2.6 Example: Complete Component Metadata

```json
{
  "irVersion": "1.0.0",
  "name": "Button",
  "type": "component",
  "version": "1.0.0",
  "maturity": "stable",
  "description": "A clickable button component with variants and disabled state.",
  "props": [
    {
      "name": "label",
      "type": "string",
      "required": true,
      "description": "Button text"
    },
    {
      "name": "variant",
      "type": "enum",
      "values": ["primary", "secondary", "ghost"],
      "default": "primary"
    },
    {
      "name": "disabled",
      "type": "boolean",
      "default": false
    }
  ],
  "slots": {
    "default": {
      "description": "Button content (overrides label if provided)"
    }
  },
  "structure": {
    "root": {
      "tag": "button",
      "attributes": { "type": "button" },
      "children": ["slot:default"]
    }
  },
  "semantics": {
    "role": "button"
  }
}
```

## 2.7 Conformance

A conforming component metadata object:

1. MUST include all properties in §2.1
2. MUST NOT have duplicate prop names or slot names
3. All prop `names` and slot names MUST be valid identifiers (alphanumeric, underscore, camelCase)
4. If `structure` is present, all referenced slots MUST be defined in `slots`
5. If `stateMachine` is present, it MUST conform to [State Machine](./04-state-machine.md) schema
6. If `semantics` is present, it MUST conform to [Accessibility](./06-accessibility.md) schema
