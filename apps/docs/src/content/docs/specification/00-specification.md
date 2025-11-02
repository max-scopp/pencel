---
title: "Universal Component Schema Specification"
description: "Platform-agnostic component definition schema for cross-platform UI development."
---


**Status**: Working Draft (WD)  
**Latest Version**: [/spec/README.md](/spec/README.md)  
**Repository**: [pencil](https://github.com/max-scopp/pencil)

## Overview

The **Universal Component Schema Specification** defines a platform-agnostic format for authoring UI components that compile to multiple targets: Web/HTML, React, React Native, SwiftUI, Flutter, WPF/XAML, and embedded/AR/VR platforms.

This specification enables:

- **Single source of truth** for component structure, styling, behaviour, and accessibility across platforms
- **Reusable design systems** that port to any platform without reimplementation
- **Consistent state management** via portable state machines (XState, Zag, platform-specific runtimes)
- **Tooling interoperability** for code generators, design plugins, and cross-platform frameworks

## Audience

This specification is written for:

- **Tool developers**: Building component compilers, code generators, and schema processors
- **Implementers**: Creating platform-specific runtimes and code generators (React, WPF, SwiftUI, etc.)
- **Design system authors**: Defining reusable components once, deploying everywhere
- **Framework maintainers**: Integrating universal components into cross-platform frameworks

## Document Structure

| Document | Purpose | Cross-References |
| --- | --- | --- |
| [Scope & Conformance](/pencel/specification/01-scope-and-conformance) | Formal scope, maturity, normative language, conformance levels | Defines RFC 2119 keywords used throughout; referenced by all documents |
| [Component Metadata](/pencel/specification/02-component-metadata) | Component schema and root structure | Root of all other sections; references [Style Tokens](/pencel/specification/03-style-tokens), [State Machine](/pencel/specification/04-state-machine), [Accessibility](/pencel/specification/06-accessibility) |
| [Style Tokens](/pencel/specification/03-style-tokens) | Primitive, semantic, and component-scoped token definitions | Referenced by [Component Metadata](/pencel/specification/02-component-metadata) (`styleTokens` property); linked to [State Machine](/pencel/specification/04-state-machine) via `styleMap` |
| [State Machine](/pencel/specification/04-state-machine) | Behaviour, state definitions, transitions, events | Referenced by [Component Metadata](/pencel/specification/02-component-metadata) (`stateMachine` property); maps states to [Style Tokens](/pencel/specification/03-style-tokens) via `styleMap`; coordinates [Bindings & Data](/pencel/specification/07-bindings-and-data) |
| [Slots & Structure](/pencel/specification/05-slots-and-structure) | Internal component hierarchy and named slots | Referenced by [Component Metadata](/pencel/specification/02-component-metadata) (`structure` property); detailed DOM mapping |
| [Accessibility](/pencel/specification/06-accessibility) | Semantic roles, labels, and platform-specific mappings | Referenced by [Component Metadata](/pencel/specification/02-component-metadata) (`semantics` property); works with [State Machine](/pencel/specification/04-state-machine) for accessible interactions |
| [Bindings & Data](/pencel/specification/07-bindings-and-data) | Reactive data flow and binding semantics | Referenced by [Component Metadata](/pencel/specification/02-component-metadata) (`bindings` property); coordinates with [State Machine](/pencel/specification/04-state-machine) for context updates |
| [Platform Mapping](/pencel/specification/08-platform-mapping) | Target platform compilation and runtime semantics | Consumes all schema sections; compiles [Style Tokens](/pencel/specification/03-style-tokens) and [State Machine](/pencel/specification/04-state-machine) to platform code |
| [Type System](/pencel/specification/09-type-system) | Unified type definitions, schemas, and reusable type references | Referenced by [Component Metadata](/pencel/specification/02-component-metadata) (`types` property); supports props, events, and nested structures |

## Quick Start

A minimal component definition:

```json
{
  "schemaVersion": "1.0.0",
  "name": "Button",
  "type": "component",
  "props": [
    {
      "name": "label",
      "type": "string",
      "required": true
    }
  ],
  "slots": {
    "default": {
      "description": "Button content"
    }
  },
  "structure": {
    "root": {
      "tag": "button",
      "attributes": {
        "type": "button"
      },
      "children": ["slot:default"]
    }
  },
  "semantics": {
    "role": "button"
  }
}
```

## Specification Dependencies

The following diagram shows how specification modules depend on one another:

```
┌────────────────────────────────────────────────────┐
│  01. Scope & Conformance                           │
│  (RFC 2119 keywords, maturity, error handling)     │
│  ↑ Referenced by ALL                               │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  02. Component Metadata (ROOT)                     │
│  (name, props, slots, structure)                   │
├─────────────────┬──────────────────┬───────────────┤
│                 │                  │               │
↓                 ↓                  ↓               ↓
03. Style        04. State          05. Slots &    06. Access-
Tokens           Machine            Structure      ibility
├─────────┬──────┴──────┬─────────┐
│         │             │         │
│         ↓             ↓         │
│     styleMap    (state→       │
│     (aliases)   tokens)        │
│         │             │         │
└─────────┴─────────────┴─────────┘
          │                │
          ↓                ↓
        07. Bindings & Data
        (context updates, reactive flow)
          │
          ↓
        08. Platform Mapping
        (compile schema → Web, React, Native, XAML, etc.)
```

## Maturity & Process

**Current Status**: Working Draft (WD)

- Expect breaking changes during this phase
- All feedback welcome via repository issues
- Formal W3C review and standardization to follow

## References

- [RFC 2119 — Requirement Levels](https://tools.ietf.org/html/rfc2119)
- [W3C Process Document](https://www.w3.org/2023/Process-20231101/)
- [Web Platform Design Principles](https://w3ctag.github.io/design-principles/)

## Cross-Reference Index

**Quick navigation by use case:**

### I want to define component structure and API
→ Start with [Component Metadata](/pencel/specification/02-component-metadata)
- Define `name`, `version`, `props`, `slots`, `structure`
- Then reference [Style Tokens](/pencel/specification/03-style-tokens), [State Machine](/pencel/specification/04-state-machine), [Accessibility](/pencel/specification/06-accessibility)

### I want to define visual design and theming
→ Start with [Style Tokens](/pencel/specification/03-style-tokens)
- Organize tokens: primitive → semantic → component-scoped
- Reference [W3C Design Tokens Format Module](https://www.designtokens.org/tr/drafts/format/)
- Link to [State Machine](/pencel/specification/04-state-machine) `styleMap` for state-dependent styling

### I want to define user interactions and behaviour
→ Start with [State Machine](/pencel/specification/04-state-machine)
- Define states, events, transitions, context
- Map states to [Style Tokens](/pencel/specification/03-style-tokens) via `styleMap`
- Reference [XState](https://stately.ai/docs/xstate) and [Zag.js](https://zagjs.com/) for patterns
- Coordinate with [Bindings & Data](/pencel/specification/07-bindings-and-data) for reactive updates

### I want to define reactive data flow
→ See [Bindings & Data](/pencel/specification/07-bindings-and-data)
- One-way and two-way binding semantics
- Coordinates with [State Machine](/pencel/specification/04-state-machine) context updates

### I want to define accessibility
→ See [Accessibility](/pencel/specification/06-accessibility)
- Semantic roles, ARIA attributes, keyboard interaction
- Integrates with [State Machine](/pencel/specification/04-state-machine) for state announcements

### I want to define internal component structure
→ See [Slots & Structure](/pencel/specification/05-slots-and-structure)
- DOM hierarchy, slot placement
- Referenced by [Component Metadata](/pencel/specification/02-component-metadata) `structure` property

### I want to understand how to compile components to a specific platform
→ See [Platform Mapping](/pencel/specification/08-platform-mapping)
- Web/HTML, React, React Native, SwiftUI, Flutter, WPF/XAML, embedded
- Consumes [Style Tokens](/pencel/specification/03-style-tokens), [State Machine](/pencel/specification/04-state-machine), [Accessibility](/pencel/specification/06-accessibility)

### I need conformance guidelines
→ See [Scope & Conformance](/pencel/specification/01-scope-and-conformance)
- RFC 2119 definitions, error handling, versioning
- Referenced by all documents
