---
title: "Scope & Conformance"
description: "Component IR specification scope, conformance criteria, and versioning guidelines."
---

# Scope & Conformance

## 1. Scope

This specification defines the **Universal Component IR (Intermediate Representation)**, a JSON-based format for declaring UI components in a platform-agnostic manner.

The scope includes:

- **Component definition schema** (structure, props, slots, variants)
- **Style token system** (primitive, semantic, component-scoped)
- **State machine definitions** for component behaviour
- **Accessibility metadata** (roles, labels, semantic mappings)
- **Reactive bindings** (one-way, two-way data flow)
- **Platform mapping semantics** (how IR compiles to target platforms)

The scope explicitly **excludes**:

- Implementation-specific runtime behaviour (platform emitters determine this)
- Design tools or authoring interfaces (out of scope; tools may implement them)
- Animation/transition timing specifications (deferred to platform runtimes)
- Specific CSS or platform-native styling rules (platforms apply these)
- Design token resolution algorithms (platform-specific concern)

## 2. Conformance

A **conforming component** is a JSON object that:

1. Adheres to the schema defined in this specification
2. Contains all REQUIRED properties as specified per section
3. Uses MUST/SHOULD/MAY keywords as defined in [RFC 2119](https://tools.ietf.org/html/rfc2119)

A **conforming emitter** is a tool that:

1. Accepts a conforming component IR
2. Produces executable target code (e.g., React, Web Components, SwiftUI)
3. Preserves component semantics and state machine behaviour across compilation
4. MUST NOT alter component structure, props, or accessibility metadata without explicit configuration

A **conforming runtime** is a platform-specific implementation that:

1. Interprets component metadata, states, and bindings
2. Maps IR states to platform-specific visual/interaction states
3. Executes transitions and event handlers according to state machine definitions

## 3. Normative Language

The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://tools.ietf.org/html/rfc2119).

## 4. Maturity Levels

### 4.1 Component Maturity

Components are assigned one of the following maturity levels:

| Level | Definition | Use |
| --- | --- | --- |
| **Experimental** | Unstable API; breaking changes expected | Research, early prototyping |
| **Stable** | API finalized; minor refinements only | Production use; backwards compatibility expected |
| **Deprecated** | Superseded; scheduled for removal | Migrate to replacement |

### 4.2 Specification Maturity

This specification follows W3C maturity tracks:

| Status | Description |
| --- | --- |
| **Working Draft (WD)** | Early exploration; feedback encouraged; breaking changes expected |
| **Candidate Recommendation (CR)** | Feature-complete; implementation phase; changes only for interoperability |
| **Proposed Recommendation (PR)** | Accepted by W3C members; final review phase |
| **Recommendation (REC)** | Standard; stable; backwards compatibility guaranteed |

**Current**: Working Draft (WD)

## 5. Error Handling

Conforming implementations MUST report errors with:

- **Error code** (string identifier, e.g., `INVALID_COMPONENT_SCHEMA`)
- **Message** (human-readable description)
- **Context** (line number, property path, related schema section)

Implementations MAY halt validation on first error (fail-fast) or accumulate all errors and report together.

## 6. Versioning

The IR follows semantic versioning:

- **Major**: Breaking schema changes (e.g., removal of required properties)
- **Minor**: Additive changes (new optional properties, new conformance levels)
- **Patch**: Clarifications, bug fixes, documentation updates

A component IR **MUST** declare its `irVersion` (e.g., `"1.0.0"`). Emitters MUST validate version compatibility before compilation.
