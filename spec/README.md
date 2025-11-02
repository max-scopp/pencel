---
title: "Universal Component IR Specification"
description: "Platform-agnostic component definition language for cross-platform UI development."
---

# Universal Component IR Specification

**Status**: Working Draft (WD)  
**Latest Version**: [/spec/README.md](/spec/README.md)  
**Repository**: [pencil](https://github.com/max-scopp/pencil)

## Overview

The **Universal Component IR (Intermediate Representation) Specification** defines a platform-agnostic format for authoring UI components that compile to multiple targets: Web/HTML, React, React Native, SwiftUI, Flutter, WPF/XAML, and embedded/AR/VR platforms.

This specification enables:

- **Single source of truth** for component structure, styling, behaviour, and accessibility across platforms
- **Reusable design systems** that port to any platform without reimplementation
- **Consistent state management** via portable state machines (XState, Zag, platform-specific runtimes)
- **Tooling interoperability** for code generators, design plugins, and cross-platform frameworks

## Audience

This specification is written for:

- **Tool developers**: Building component compilers, code generators, and IR emitters
- **Implementers**: Creating platform-specific runtimes and code generators (React, WPF, SwiftUI, etc.)
- **Design system authors**: Defining reusable components once, deploying everywhere
- **Framework maintainers**: Integrating universal components into cross-platform frameworks

## Document Structure

| Document | Purpose | Cross-References |
| --- | --- | --- |
| [Scope & Conformance](./01-scope-and-conformance.md) | Formal scope, maturity, normative language, conformance levels | Defines RFC 2119 keywords used throughout; referenced by all documents |
| [Component Metadata](./02-component-metadata.md) | Component IR schema and root structure | Root of all other sections; references [Style Tokens](./03-style-tokens.md), [State Machine](./04-state-machine.md), [Accessibility](./06-accessibility.md) |
| [Style Tokens](./03-style-tokens.md) | Primitive, semantic, and component-scoped token definitions | Referenced by [Component Metadata](./02-component-metadata.md) (`styleTokens` property); linked to [State Machine](./04-state-machine.md) via `styleMap` |
| [State Machine](./04-state-machine.md) | Behaviour, state definitions, transitions, events | Referenced by [Component Metadata](./02-component-metadata.md) (`stateMachine` property); maps states to [Style Tokens](./03-style-tokens.md) via `styleMap`; coordinates [Bindings & Data](./07-bindings-and-data.md) |
| [Slots & Structure](./05-slots-and-structure.md) | Internal component hierarchy and named slots | Referenced by [Component Metadata](./02-component-metadata.md) (`structure` property); detailed DOM mapping |
| [Accessibility](./06-accessibility.md) | Semantic roles, labels, and platform-specific mappings | Referenced by [Component Metadata](./02-component-metadata.md) (`semantics` property); works with [State Machine](./04-state-machine.md) for accessible interactions |
| [Bindings & Data](./07-bindings-and-data.md) | Reactive data flow and binding semantics | Referenced by [Component Metadata](./02-component-metadata.md) (`bindings` property); coordinates with [State Machine](./04-state-machine.md) for context updates |
| [Platform Mapping](./08-platform-mapping.md) | Target platform compilation and runtime semantics | Consumes all IR sections; compiles [Style Tokens](./03-style-tokens.md) and [State Machine](./04-state-machine.md) to platform code |

## Quick Start

A minimal component definition:

```json
{
  "irVersion": "1.0.0",
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
        (compile IR → Web, React, Native, XAML, etc.)
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
→ Start with [Component Metadata](./02-component-metadata.md)
- Define `name`, `version`, `props`, `slots`, `structure`
- Then reference [Style Tokens](./03-style-tokens.md), [State Machine](./04-state-machine.md), [Accessibility](./06-accessibility.md)

### I want to define visual design and theming
→ Start with [Style Tokens](./03-style-tokens.md)
- Organize tokens: primitive → semantic → component-scoped
- Reference [W3C Design Tokens Format Module](https://www.designtokens.org/tr/drafts/format/)
- Link to [State Machine](./04-state-machine.md) `styleMap` for state-dependent styling

### I want to define user interactions and behaviour
→ Start with [State Machine](./04-state-machine.md)
- Define states, events, transitions, context
- Map states to [Style Tokens](./03-style-tokens.md) via `styleMap`
- Reference [XState](https://stately.ai/docs/xstate) and [Zag.js](https://zagjs.com/) for patterns
- Coordinate with [Bindings & Data](./07-bindings-and-data.md) for reactive updates

### I want to define reactive data flow
→ See [Bindings & Data](./07-bindings-and-data.md)
- One-way and two-way binding semantics
- Coordinates with [State Machine](./04-state-machine.md) context updates

### I want to define accessibility
→ See [Accessibility](./06-accessibility.md)
- Semantic roles, ARIA attributes, keyboard interaction
- Integrates with [State Machine](./04-state-machine.md) for state announcements

### I want to define internal component structure
→ See [Slots & Structure](./05-slots-and-structure.md)
- DOM hierarchy, slot placement
- Referenced by [Component Metadata](./02-component-metadata.md) `structure` property

### I want to understand how to compile IR to a specific platform
→ See [Platform Mapping](./08-platform-mapping.md)
- Web/HTML, React, React Native, SwiftUI, Flutter, WPF/XAML, embedded
- Consumes [Style Tokens](./03-style-tokens.md), [State Machine](./04-state-machine.md), [Accessibility](./06-accessibility.md)

### I need conformance guidelines
→ See [Scope & Conformance](./01-scope-and-conformance.md)
- RFC 2119 definitions, error handling, versioning
- Referenced by all documents
