---
title: "Component Metadata"
description: "Universal component schema structure, props, events, slots, and type system."
---


## 1. Overview

Component metadata defines the root structure of a universal component. It captures the component's identity, API surface (props), content slots, internal structure, styling requirements, behaviour, and accessibility semantics.

All components MUST conform to the Component Metadata schema defined in this section.

**Cross-references:** This document is the root specification. Refer to:
- [Type System](/pencel/specification/09-type-system) for `types` details and prop/event type definitions
- [Style Tokens](/pencel/specification/03-style-tokens) for `styleTokens` details
- [State Machine](/pencel/specification/04-state-machine) for `stateMachine` details
- [Accessibility](/pencel/specification/06-accessibility) for `semantics` details
- [Bindings & Data](/pencel/specification/07-bindings-and-data) for `bindings` details

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
  "schemaVersion": "1.0.0",
  "name": "string",
  "type": "component",
  "props": [],
  "events": {},
  "slots": {}
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `schemaVersion` | string | REQUIRED | Semantic version of the schema spec (e.g., `"1.0.0"`) |
| `name` | string | REQUIRED | Component name; MUST be a valid PascalCase identifier |
| `type` | enum | REQUIRED | MUST be `"component"` |
| `props` | array | REQUIRED | Array of prop definitions (see §2.3); MAY be empty array `[]` |
| `events` | object | REQUIRED | Named event definitions (see §2.5); MAY be empty object `{}` |
| `slots` | object | REQUIRED | Named slot definitions (see §2.4); MAY be empty object `{}` |

### 2.2 Optional Properties

```json
{
  "description": "string",
  "version": "string",
  "maturity": "experimental | stable | deprecated",
  "types": {},
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
| `types` | object | – | Reusable type definitions (see [Type System](/pencel/specification/09-type-system)); shared by props and events |
| `structure` | object | – | Internal component hierarchy (see §2.6) |
| `semantics` | object | – | Accessibility metadata (see [Accessibility](/pencel/specification/06-accessibility)) |
| `styleTokens` | array | – | Component-scoped style tokens (see [Style Tokens](/pencel/specification/03-style-tokens)) |
| `stateMachine` | object | – | Behaviour definition (see [State Machine](/pencel/specification/04-state-machine)) |
| `bindings` | array | – | Reactive bindings (see [Bindings & Data](/pencel/specification/07-bindings-and-data)) |

### 2.3 Props Definition

Props declare the public API of a component. See [Type System](/pencel/specification/09-type-system) §2 for detailed type definitions and examples.

Each prop is an object with the following structure:

```json
{
  "name": "string",
  "type": "string | number | boolean | enum | object | array | TypeRef",
  "required": false,
  "default": "any",
  "description": "string"
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | REQUIRED | Prop identifier; MUST be valid camelCase |
| `type` | string \| enum | REQUIRED | Scalar type, reference, or type reference; see [Type System](/pencel/specification/09-type-system) §2.3 |
| `required` | boolean | OPTIONAL (default: `false`) | Whether prop is mandatory |
| `default` | any | OPTIONAL | Default value if not provided |
| `description` | string | OPTIONAL | Documentation for the prop |

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

## 2.5 Events Definition

Events define the component's outputs — notifications it sends in response to user interactions or internal state changes. Unlike props (inputs), events are **outputs** that components emit to notify consumers.

```json
{
  "events": {
    "eventName": {
      "description": "string",
      "detail": "string | #/types/EventTypeName",
      "bubbles": true,
      "cancelable": false,
      "composed": false
    }
  }
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `description` | string | OPTIONAL | Human-readable event documentation |
| `detail` | string \| TypeRef | OPTIONAL (default: `"object"`) | Event detail type (see §2.5.1); omit for void events |
| `bubbles` | boolean | OPTIONAL (default: `false`) | Whether event propagates up the component tree (Web/WPF) |
| `cancelable` | boolean | OPTIONAL (default: `false`) | Whether event can be prevented with `preventDefault()` |
| `composed` | boolean | OPTIONAL (default: `false`) | Whether event crosses Shadow DOM boundaries (Web-specific) |

### 2.5.1 Event Detail Types

Event details describe the data structure passed when an event fires. Details MUST be one of:

1. **Omitted** — Void event (no data)
   ```json
   { "name": "ready", "description": "Component is ready" }
   ```

2. **Inline object schema** (simple cases)
   ```json
   {
     "name": "change",
     "detail": {
       "type": "object",
       "schema": {
         "value": "string",
         "timestamp": "number"
       }
     }
   }
   ```

3. **Type reference** (reusable, complex types)
   ```json
   {
     "name": "click",
     "detail": "#/types/ClickEventDetail"
   }
   ```

### 2.5.2 Example: Events Using Global Types

Events reference types defined once in the global `types` section (same as props, slots, etc.):

```json
{
  "schemaVersion": "1.0.0",
  "name": "Button",
  "type": "component",
  "types": {
    "ClickEventDetail": {
      "description": "Details of a button click event",
      "schema": {
        "timestamp": "number",
        "x": "number",
        "y": "number",
        "shiftKey": { "type": "boolean", "optional": true }
      }
    },
    "FocusEventDetail": {
      "description": "Details of focus event",
      "schema": {
        "timestamp": "number",
        "relatedTarget": { "type": "string", "optional": true }
      }
    }
  },
  "events": {
    "click": {
      "description": "Fired when button is clicked",
      "detail": "#/types/ClickEventDetail",
      "bubbles": true,
      "cancelable": true
    },
    "focus": {
      "description": "Fired when button receives focus",
      "detail": "#/types/FocusEventDetail",
      "bubbles": false,
      "cancelable": false
    },
    "disabled": {
      "description": "Fired when button becomes disabled",
      "bubbles": false
    }
  }
}
```

**All event details reference the unified `types` section — no separate/doubled type definitions.**

### 2.5.3 Platform Compilation

Event definitions compile to platform-specific event models:

| Platform | Mapping | Example |
| --- | --- | --- |
| **Web** | DOM CustomEvent | `new CustomEvent('click', { detail, bubbles, cancelable, composed })` |
| **React** | Callback props | `onClick?: (detail: ClickEventDetail) => void` |
| **React Native** | Callback props | `onPress?: (detail: ClickEventDetail) => void` |
| **WPF** | Routed Events | `RoutingStrategy.Bubble` (from `bubbles`), `RoutedEventArgs<ClickEventDetail>` |
| **Swift** | Closure callbacks | `onClickAction?: @escaping (ClickEventDetail) -> Void` |

---

## 2.6 Internal Structure

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

More details in [Slots & Structure](/pencel/specification/05-slots-and-structure).

## 2.7 Example: Complete Component Metadata with Global Types

```json
{
  "schemaVersion": "1.0.0",
  "name": "Button",
  "type": "component",
  "version": "1.0.0",
  "maturity": "stable",
  "description": "A clickable button component with variants and disabled state.",
  "types": {
    "ButtonVariant": {
      "description": "Button visual style variant",
      "schema": {
        "variant": { "type": "enum", "values": ["primary", "secondary", "ghost"] }
      },
      "examples": ["primary", "ghost"]
    },
    "ClickEventDetail": {
      "description": "Details of a button click event",
      "schema": {
        "timestamp": "number",
        "x": "number",
        "y": "number",
        "shiftKey": { "type": "boolean", "optional": true },
        "ctrlKey": { "type": "boolean", "optional": true }
      },
      "examples": [
        { "timestamp": 1667890123456, "x": 100, "y": 50 }
      ]
    },
    "FocusEventDetail": {
      "description": "Details of focus event",
      "schema": {
        "timestamp": "number",
        "relatedTarget": { "type": "string", "optional": true }
      }
    }
  },
  "props": [
    {
      "name": "label",
      "type": "string",
      "required": true,
      "description": "Button text"
    },
    {
      "name": "variant",
      "type": "#/types/ButtonVariant",
      "default": "primary",
      "description": "Button style variant"
    },
    {
      "name": "disabled",
      "type": "boolean",
      "default": false
    }
  ],
  "events": {
    "click": {
      "description": "Fired when button is clicked",
      "detail": "#/types/ClickEventDetail",
      "bubbles": true,
      "cancelable": true,
      "composed": false
    },
    "focus": {
      "description": "Fired when button receives focus",
      "detail": "#/types/FocusEventDetail",
      "bubbles": false,
      "cancelable": false
    }
  },
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

**Single source of truth:** All types defined in one `types` section, reused across props, events, and nested structures.

## 2.8 Conformance

A conforming component metadata object:

1. MUST include all properties in §2.1
2. MUST NOT have duplicate prop names, event names, slot names, or type names
3. All prop `names`, event names, slot names, and type names MUST be valid identifiers (alphanumeric, underscore, camelCase for props/events, kebab-case for events in Web)
4. If `types` is present:
   - Each type MUST have a unique name (key) within the `types` object
   - Each type MUST include a `schema` property with at least one property definition
   - All type references (`#/types/TypeName`) MUST resolve to a type defined in the `types` section
   - Type references MUST NOT create circular dependencies (e.g., Type A → Type B → Type A)
   - Property types within a schema MUST use valid type syntax (scalar, reference, or `#/types/Reference`)
5. All prop type definitions MUST be valid:
   - Enum props MUST have a non-empty `values` array
   - Array props MUST have an `items` property with a valid type
   - Object props MUST have a `schema` property (inline or via type reference)
   - Type references MUST resolve to existing types in the `types` section
6. All event definitions MUST be valid:
   - Event `detail` (if present) MUST be either:
     - A scalar type string (`"string"`, `"number"`, `"boolean"`, `"object"`)
     - An inline object schema with `type: "object"` and `schema` property
     - A type reference (`#/types/EventDetailType`) that resolves to a type in `types`
   - Type references in event details MUST resolve to existing types
   - `bubbles`, `cancelable`, `composed` MUST be boolean values
   - Event names MUST follow Web API conventions (lowercase, no spaces)
7. If `structure` is present, all referenced slots MUST be defined in `slots`
8. If `stateMachine` is present, it MUST conform to [State Machine](/pencel/specification/04-state-machine) schema
9. If `semantics` is present, it MUST conform to [Accessibility](/pencel/specification/06-accessibility) schema
