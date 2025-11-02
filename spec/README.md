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

| Document | Purpose |
| --- | --- |
| [Scope & Conformance](./01-scope-and-conformance.md) | Formal scope, maturity, normative language, conformance levels |
| [Component Metadata](./02-component-metadata.md) | Component IR schema and root structure |
| [Style Tokens](./03-style-tokens.md) | Primitive, semantic, and component-scoped token definitions |
| [State Machine](./04-state-machine.md) | Behaviour, state definitions, transitions, events |
| [Slots & Structure](./05-slots-and-structure.md) | Internal component hierarchy and named slots |
| [Accessibility](./06-accessibility.md) | Semantic roles, labels, and platform-specific mappings |
| [Bindings & Data](./07-bindings-and-data.md) | Reactive data flow and binding semantics |
| [Platform Mapping](./08-platform-mapping.md) | Target platform compilation and runtime semantics |

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

## Maturity & Process

**Current Status**: Working Draft (WD)

- Expect breaking changes during this phase
- All feedback welcome via repository issues
- Formal W3C review and standardization to follow

## References

- [RFC 2119 — Requirement Levels](https://tools.ietf.org/html/rfc2119)
- [W3C Process Document](https://www.w3.org/2023/Process-20231101/)
- [Web Platform Design Principles](https://w3ctag.github.io/design-principles/)
