---
title: "Type System"
description: "Universal Component IR type definitions, schemas, and reusable type references."
---

# Type System

## 1. Overview

The Type System provides a unified, schema-based approach to defining component data structures. It serves as a **single source of truth** for all type definitions used across props, events, state, and nested structures.

All components SHOULD use the type system to:

- Define reusable types in a central `types` section
- Reference types consistently via `#/types/TypeName` throughout the component
- Support nested type composition for complex data structures
- Enable cross-platform code generation and validation

**Cross-references:**
- Declared in [Component Metadata](/pencel/specification/02-component-metadata) via `types` property
- Used in props ([Component Metadata](/pencel/specification/02-component-metadata) §2.3)
- Used in events ([Component Metadata](/pencel/specification/02-component-metadata) §2.5)
- Organized per [JSON Schema](https://json-schema.org/) principles for validation

## 2. Type System Structure

### 2.1 Types Section

The `types` section is a **global, unified type registry** at the root level of a component definition:

```json
{
  "irVersion": "1.0.0",
  "name": "DataTable",
  "type": "component",
  "types": {
    "DataRecord": {
      "description": "A single row of table data",
      "schema": {
        "id": "string",
        "name": { "type": "string" },
        "email": { "type": "string", "optional": true }
      }
    },
    "SortConfig": {
      "description": "Configuration for column sorting",
      "schema": {
        "column": "string",
        "direction": { "type": "enum", "values": ["asc", "desc"] }
      }
    }
  },
  "props": [
    {
      "name": "data",
      "type": "array",
      "items": "#/types/DataRecord"
    },
    {
      "name": "sortConfig",
      "type": "#/types/SortConfig",
      "required": false
    }
  ]
}
```

### 2.2 Type Definition Structure

Each type in `types` is an object with the following structure:

```json
{
  "TypeName": {
    "description": "Human-readable purpose of this type",
    "schema": {
      "propertyName": "type | TypeRef | ComplexType"
    }
  }
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `description` | string | OPTIONAL | Documentation for the type |
| `schema` | object | REQUIRED | Property definitions; maps names to types or references |

### 2.3 Supported Type Categories

#### 2.3.1 Scalar Types

Scalar types represent primitive values:

| Type | Description | Example |
| --- | --- | --- |
| `"string"` | Text value | `"hello"` |
| `"number"` | Numeric value (int or float) | `42`, `3.14` |
| `"boolean"` | Boolean value | `true`, `false` |

**Usage in schema:**

```json
{
  "schema": {
    "label": "string",
    "count": "number",
    "isActive": "boolean"
  }
}
```

#### 2.3.2 Enum Types

Enums declare a fixed set of literal string values:

```json
{
  "Direction": {
    "description": "Sort direction",
    "schema": {
      "value": { "type": "enum", "values": ["asc", "desc"] }
    }
  }
}
```

Enum definition within a property:

```json
{
  "schema": {
    "size": {
      "type": "enum",
      "values": ["small", "medium", "large"],
      "default": "medium"
    }
  }
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | string | REQUIRED | MUST be `"enum"` |
| `values` | array | REQUIRED | Array of string literals |
| `default` | string | OPTIONAL | Must be one of `values` if provided |

#### 2.3.3 Array Types

Arrays contain homogeneous items of a single type:

```json
{
  "tags": {
    "type": "array",
    "items": "string",
    "description": "List of string tags"
  }
}
```

**Array of primitives:**

```json
{
  "schema": {
    "tags": {
      "type": "array",
      "items": "string"
    }
  }
}
```

**Array of objects:**

```json
{
  "schema": {
    "rows": {
      "type": "array",
      "items": {
        "type": "object",
        "schema": {
          "id": "string",
          "label": "string",
          "checked": { "type": "boolean", "optional": true }
        }
      }
    }
  }
}
```

**Array of referenced types:**

```json
{
  "schema": {
    "dataSource": {
      "type": "array",
      "items": "#/types/DataRecord"
    }
  }
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | string | REQUIRED | MUST be `"array"` |
| `items` | string \| TypeRef \| object | REQUIRED | Type of array elements |

#### 2.3.4 Object Types

Objects define structured data with named properties. Objects can be **inline** (for simple cases) or **referenced** (from the global `types` section).

**Inline object definition:**

```json
{
  "schema": {
    "position": {
      "type": "object",
      "schema": {
        "x": "number",
        "y": "number"
      }
    }
  }
}
```

**Referenced object type:**

```json
{
  "schema": {
    "config": {
      "type": "#/types/CustomConfig"
    }
  }
}
```

##### 2.3.4.1 Object Schema Structure

Object schemas map property names to types or complex definitions:

```json
{
  "schema": {
    "propertyName": "string | number | boolean | #/types/TypeName",
    "optionalProperty": { "type": "string", "optional": true },
    "complexProperty": { "type": "#/types/NestedType" },
    "nestedObject": {
      "type": "object",
      "schema": {
        "inner": "string"
      }
    }
  }
}
```

Each property MAY include:

| Property | Type | Description |
| --- | --- | --- |
| `type` | string \| TypeRef | Type of the property |
| `optional` | boolean | Whether property is optional (default: `false`) |
| `description` | string | Documentation for the property |
| `default` | any | Default value for the property |

**Example with optional and nested properties:**

```json
{
  "RequestConfig": {
    "description": "HTTP request configuration",
    "schema": {
      "url": "string",
      "method": {
        "type": "enum",
        "values": ["GET", "POST", "PUT", "DELETE"],
        "default": "GET"
      },
      "timeout": {
        "type": "number",
        "optional": true,
        "default": 5000,
        "description": "Request timeout in milliseconds"
      },
      "headers": {
        "type": "object",
        "schema": {
          "contentType": { "type": "string", "optional": true },
          "authorization": { "type": "string", "optional": true }
        }
      }
    }
  }
}
```

#### 2.3.5 Type References

Type references enable reuse of centrally-defined types:

**Reference format:** `"#/types/TypeName"`

**Single type reference:**

```json
{
  "schema": {
    "config": "#/types/CustomConfig"
  }
}
```

**Required vs optional reference:**

```json
{
  "schema": {
    "requiredConfig": "#/types/Config",
    "optionalConfig": {
      "type": "#/types/Config",
      "optional": true
    }
  }
}
```

**Array of referenced type:**

```json
{
  "schema": {
    "items": {
      "type": "array",
      "items": "#/types/DataRecord"
    }
  }
}
```

## 3. Type Definition Patterns

### 3.1 Single Source of Truth

Define each complex type **once** in the `types` section and reference it everywhere:

```json
{
  "types": {
    "DataRecord": {
      "description": "Core data model",
      "schema": {
        "id": "string",
        "name": "string",
        "metadata": "#/types/Metadata"
      }
    }
  },
  "props": [
    { "name": "data", "type": "#/types/DataRecord" }
  ],
  "events": {
    "onRecordChange": {
      "detail": "#/types/DataRecord"
    }
  }
}
```

### 3.2 Hierarchical Type Composition

Build complex types by composing simpler, well-defined types:

```json
{
  "types": {
    "Address": {
      "schema": {
        "street": "string",
        "city": "string",
        "postalCode": "string",
        "country": "string"
      }
    },
    "Contact": {
      "schema": {
        "email": "string",
        "phone": { "type": "string", "optional": true }
      }
    },
    "User": {
      "schema": {
        "id": "string",
        "name": "string",
        "address": "#/types/Address",
        "contact": "#/types/Contact"
      }
    }
  },
  "props": [
    { "name": "user", "type": "#/types/User" }
  ]
}
```

### 3.3 Optional and Required Properties

Mark properties as optional with the `optional` flag; omit or set to `false` for required:

```json
{
  "RequestOptions": {
    "schema": {
      "url": "string",
      "method": {
        "type": "enum",
        "values": ["GET", "POST"],
        "default": "GET"
      },
      "body": { "type": "string", "optional": true },
      "timeout": { "type": "number", "optional": true, "default": 5000 }
    }
  }
}
```

### 3.4 Enums with Defaults

Use enums for fixed sets of values; provide sensible defaults:

```json
{
  "SizeVariant": {
    "schema": {
      "value": {
        "type": "enum",
        "values": ["xs", "sm", "md", "lg", "xl"],
        "default": "md"
      }
    }
  }
}
```

### 3.5 Nested Objects

Nest objects for logical grouping; consider extracting to named types for reuse:

```json
{
  "types": {
    "StyleConfig": {
      "schema": {
        "color": "string",
        "fontSize": "number",
        "fontWeight": { "type": "number", "optional": true }
      }
    },
    "TextElement": {
      "schema": {
        "content": "string",
        "style": "#/types/StyleConfig"
      }
    }
  }
}
```

## 4. Type Reference Syntax

### 4.1 JSON Pointer References

References use [JSON Pointer](https://tools.ietf.org/html/rfc6901) syntax:

- `"#/types/TypeName"` — Reference to type in `types` section
- Must match the exact key in the `types` object
- Case-sensitive

### 4.2 Reference Validation

Conforming implementations MUST:

1. Resolve all type references before validation
2. Detect and report circular type dependencies (e.g., `A` → `B` → `A`)
3. Report missing type references with clear error messages
4. Support forward references (referencing types defined later in `types`)

**Example error:**

```
Error: UNRESOLVED_TYPE_REFERENCE
- Message: Type reference "#/types/NonExistent" not found in types section
- Property path: props[0].type
- Context: "UserData" type definition
```

## 5. Code Generation Patterns

### 5.1 TypeScript Code Generation

Emit TypeScript interfaces from type definitions:

```typescript
// From IR type definition
{
  "DataRecord": {
    "schema": {
      "id": "string",
      "name": "string",
      "active": { "type": "boolean", "optional": true }
    }
  }
}

// Generates:
export interface DataRecord {
  id: string;
  name: string;
  active?: boolean;
}
```

### 5.2 JSON Schema Export

Convert types to JSON Schema for validation:

```json
{
  "$schema": "http://json-schema.org/draft-2020-12/schema",
  "title": "DataRecord",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "active": { "type": "boolean" }
  },
  "required": ["id", "name"]
}
```

### 5.3 Runtime Validation

Use types to generate runtime validators:

```typescript
// Pseudo-code
const validator = compileValidator("#/types/DataRecord");
const result = validator({ id: "1", name: "Alice" });
if (!result.valid) {
  console.error(result.errors);
}
```

## 6. Conformance

A conforming type system MUST:

1. Define types in the global `types` section at component root
2. Use consistent type reference syntax (`#/types/TypeName`)
3. Resolve all type references to valid definitions
4. Support circular dependency detection
5. Validate property types match declared types
6. Support optional property inference
7. Provide default values where specified
8. Report type mismatches with clear diagnostics

## 7. References

- [JSON Schema](https://json-schema.org/)
- [JSON Pointer (RFC 6901)](https://tools.ietf.org/html/rfc6901)
- [TypeScript Type System](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [W3C Design Tokens Format Module](https://www.designtokens.org/tr/drafts/format/)
