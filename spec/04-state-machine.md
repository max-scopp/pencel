# State Machine & Behaviour

## 1. Overview

Component behaviour is defined through finite state machines (FSMs) and statecharts. This specification aligns with industry-standard approaches from **XState** and **Zag.js** while providing component-focused guidance.

A state machine defines:

- **States** — Discrete, named conditions (e.g., `idle`, `loading`, `error`)
- **Events** — User actions or system triggers that cause transitions
- **Transitions** — Rules governing state changes (from state A to state B on event X)
- **Actions** — Side effects triggered during transitions (update UI, log analytics)
- **Guards** — Conditions that must be true for a transition to occur
- **Context** — Shared state data that persists across states

All component IRs SHOULD include a `stateMachine` definition that captures component interaction patterns and state-dependent styling.

**Cross-references:**
- Declared in [Component Metadata](./02-component-metadata.md) via `stateMachine` property
- Links states to [Style Tokens](./03-style-tokens.md) via `styleMap` property (§5 of this document)
- Interacts with [Bindings & Data](./07-bindings-and-data.md) via context updates
- Complements [Accessibility](./06-accessibility.md) for keyboard and screen reader state announcements
- Inspired by [XState](https://stately.ai/docs/xstate) and [Zag.js](https://zagjs.com/)

## 2. State Machine Structure

### 2.1 Machine Definition

```json
{
  "name": "Button",
  "stateMachine": {
    "id": "button",
    "initial": "idle",
    "context": {
      "disabled": false,
      "loading": false,
      "focusedIndex": -1
    },
    "states": {
      "idle": {
        "description": "Button is ready for interaction",
        "on": {
          "CLICK": {
            "target": "pressed",
            "actions": ["handleClick"]
          },
          "FOCUS": {
            "target": "focused"
          },
          "DISABLE": {
            "target": "disabled",
            "actions": ["assignDisabled"]
          }
        }
      },
      "pressed": {
        "description": "Button has been clicked",
        "on": {
          "RELEASE": {
            "target": "idle",
            "actions": ["completeAction"]
          }
        }
      },
      "focused": {
        "description": "Button has keyboard focus",
        "on": {
          "BLUR": {
            "target": "idle"
          },
          "ENTER": {
            "target": "pressed",
            "actions": ["handleClick"]
          }
        }
      },
      "disabled": {
        "description": "Button is not interactive",
        "on": {
          "ENABLE": {
            "target": "idle",
            "actions": ["assignEnabled"]
          }
        }
      }
    },
    "styleMap": {
      "idle": ["button-base", "button-hover"],
      "pressed": ["button-base", "button-active"],
      "focused": ["button-base", "button-focus"],
      "disabled": ["button-base", "button-disabled"]
    }
  }
}
```

### 2.2 Machine Properties

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | REQUIRED | Unique machine identifier |
| `initial` | string | REQUIRED | Starting state name |
| `context` | object | OPTIONAL | Shared state data; initial values |
| `states` | object | REQUIRED | Named states and transitions; keys are state names |
| `on` | object | OPTIONAL | Global event handlers (apply to all states) |
| `styleMap` | object | OPTIONAL | Mapping of states to style token names (component-scoped) |

### 2.3 State Definition

Each state in the `states` object defines transitions and metadata:

```json
{
  "stateName": {
    "description": "Human-readable state purpose",
    "type": "compound | parallel | atomic",
    "initial": "nestedStateName",
    "on": {
      "EVENT_NAME": {
        "target": "targetStateName",
        "guard": "guardFunctionName",
        "actions": ["actionName1", "actionName2"],
        "description": "What happens on this event"
      }
    },
    "entry": ["onEnterAction1", "onEnterAction2"],
    "exit": ["onExitAction1"]
  }
}
```

| Property | Type | Description |
| --- | --- | --- |
| `description` | string | Documentation for the state |
| `type` | enum | `atomic` (leaf), `compound` (nested), `parallel` (concurrent substates) |
| `initial` | string | Default substate if compound |
| `on` | object | Event handlers → transitions |
| `entry` | array | Actions executed when entering state |
| `exit` | array | Actions executed when exiting state |

### 2.4 Event & Transition Definition

```json
{
  "EVENT_NAME": {
    "target": "targetStateName",
    "guard": "guardConditionName",
    "actions": ["action1", "action2"],
    "description": "What this transition does"
  }
}
```

| Property | Type | Description |
| --- | --- | --- |
| `target` | string | Target state; omit for internal transitions |
| `guard` | string | Condition name; transition only if true |
| `actions` | array | Actions to execute on transition |
| `description` | string | Documentation |

**Transition Types:**

- **External** — Exits current state, executes exit actions, enters target state
- **Internal** — Does NOT exit/enter; only executes actions (no target or `target: null`)

### 2.5 Context & Data

Context holds shared state that persists across transitions:

```json
{
  "stateMachine": {
    "context": {
      "isDisabled": false,
      "isLoading": false,
      "errorMessage": null,
      "selectedIndex": -1,
      "focusedIndex": -1
    },
    "states": {
      "loading": {
        "on": {
          "SUCCESS": {
            "target": "idle",
            "actions": ["clearError", "updateData"]
          },
          "ERROR": {
            "target": "error",
            "actions": ["setError"]
          }
        }
      }
    }
  }
}
```

Actions can assign context values:

```json
{
  "actions": {
    "setError": {
      "type": "assign",
      "assignment": { "errorMessage": "$event.message" }
    },
    "clearError": {
      "type": "assign",
      "assignment": { "errorMessage": null }
    }
  }
}
```

### 2.6 Guards (Conditional Transitions)

Guards evaluate conditions before allowing transitions:

```json
{
  "SUBMIT": {
    "target": "submitting",
    "guard": "isFormValid",
    "actions": ["submitForm"]
  }
}
```

Guard implementations are platform-specific but receive:

- `context` — Current context values
- `event` — Triggering event and its payload
- `state` — Current state object

## 3. Reference Implementation: XState

**XState** is a mature, production-ready state machine library demonstrating best practices.

### 3.1 XState Machine Example

```typescript
import { createMachine, assign } from 'xstate';

const buttonMachine = createMachine({
  id: 'button',
  initial: 'idle',
  context: {
    disabled: false,
    loading: false,
  },
  states: {
    idle: {
      on: {
        CLICK: {
          target: 'pressed',
          actions: assign({ loading: true }),
        },
        FOCUS: 'focused',
        DISABLE: {
          target: 'disabled',
          actions: assign({ disabled: true }),
        },
      },
    },
    pressed: {
      on: {
        RELEASE: {
          target: 'idle',
          actions: assign({ loading: false }),
        },
      },
    },
    focused: {
      on: {
        BLUR: 'idle',
        ENTER: {
          target: 'pressed',
          actions: assign({ loading: true }),
        },
      },
    },
    disabled: {
      on: {
        ENABLE: {
          target: 'idle',
          actions: assign({ disabled: false }),
        },
      },
    },
  },
});

// Usage
import { createActor } from 'xstate';

const actor = createActor(buttonMachine).start();
actor.send({ type: 'CLICK' });
actor.subscribe(state => console.log(state.value)); // 'pressed'
```

### 3.2 XState Features Exemplifying Best Practices

| Feature | IR Equivalent | Benefit |
| --- | --- | --- |
| `initial` state | Initial state declaration | Explicit entry point |
| `context` | Persistent data across states | Stateful component logic |
| `on` transitions | Event → target + actions | Predictable state changes |
| `actions` (assign) | Context updates | Type-safe data mutations |
| `guards` | Conditional transitions | Validation before state change |
| `entry`/`exit` | Lifecycle hooks | Side effects at boundaries |
| `compound` states | Nested hierarchies | Complex state management |
| Actor model | Encapsulated machine instances | Composable state machines |

## 4. Reference Implementation: Zag.js

**Zag.js** demonstrates framework-agnostic component design using statecharts, providing the "connect API" pattern that separates logic from rendering.

### 4.1 Zag Machine Architecture

Zag separates concerns into:

1. **Machine** — Pure state machine logic (framework-agnostic)
2. **API** — Derived output and DOM bindings (via `connect` function)
3. **Renderer** — Framework-specific UI rendering (React, Vue, Solid, Svelte)

### 4.2 Zag Pattern Example: Number Input

```typescript
// Machine (framework-agnostic)
export const numberInputMachine = createMachine({
  id: 'numberInput',
  initial: 'ready',
  context: {
    value: 0,
    min: 0,
    max: 100,
    step: 1,
  },
  states: {
    ready: {
      on: {
        'INPUT.CHANGE': {
          actions: assign((context, event) => ({
            value: Math.max(context.min, Math.min(context.max, event.value)),
          })),
        },
        'INPUT.INCREMENT': {
          actions: assign((context) => ({
            value: context.value + context.step,
          })),
        },
        'INPUT.DECREMENT': {
          actions: assign((context) => ({
            value: context.value - context.step,
          })),
        },
      },
    },
  },
});

// Connect function (translates machine to API)
export function connect(state, send) {
  return {
    value: state.context.value,
    getRootProps: () => ({ role: 'group' }),
    getInputProps: () => ({
      type: 'number',
      value: state.context.value,
      min: state.context.min,
      max: state.context.max,
      onChange: (e) => send({ type: 'INPUT.CHANGE', value: e.target.value }),
    }),
    getIncrementTriggerProps: () => ({
      onClick: () => send({ type: 'INPUT.INCREMENT' }),
    }),
    getDecrementTriggerProps: () => ({
      onClick: () => send({ type: 'INPUT.DECREMENT' }),
    }),
  };
}

// React usage
import { useMachine } from '@zag-js/react';

export function NumberInput() {
  const [state, send] = useMachine(numberInputMachine);
  const api = connect(state, send);

  return (
    <div {...api.getRootProps()}>
      <button {...api.getDecrementTriggerProps()}>−</button>
      <input {...api.getInputProps()} />
      <button {...api.getIncrementTriggerProps()}>+</button>
    </div>
  );
}
```

### 4.3 Zag Features Exemplifying Best Practices

| Feature | IR Equivalent | Benefit |
| --- | --- | --- |
| Separated machine logic | `stateMachine` definition | Framework-agnostic behaviour |
| Connect API | API surface mapping states to DOM | Decoupled logic from rendering |
| Context as single source of truth | `context` object | Predictable data flow |
| Event-driven transitions | Named events with payloads | Explicit interaction patterns |
| Derived state | Computed from machine state | Lean, declarative output |
| Accessibility built-in | ARIA attributes via API | Compliance by default |

## 5. State → Style Mapping

Components link state machines to style tokens via the `styleMap` property:

```json
{
  "styleMap": {
    "idle": ["button-base", "button-default"],
    "pressed": ["button-base", "button-active"],
    "focused": ["button-base", "button-focus"],
    "disabled": ["button-base", "button-disabled"],
    "loading": ["button-base", "button-loading"]
  }
}
```

At runtime, the active state determines which component-scoped tokens apply. Emitters translate this to:

- **Web/CSS** — Dynamic class names: `.button-active`, `.button-focus`
- **React** — Conditional `className` or inline styles
- **Native** — Platform-specific visual states (iOS `.highlighted`, Android pressed state)
- **XAML** — `VisualStateManager` groups (e.g., `CommonStates.Pressed`)

## 6. Anatomy: From Machine to UI

```
┌─────────────────────────────────────────────────┐
│ User Interaction (click, focus, keyboard, etc.) │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
        ┌────────────────┐
        │  Event Sent    │
        │ (e.g. CLICK)   │
        └────────┬───────┘
                 │
                 ↓
    ┌────────────────────────┐
    │  State Machine         │
    │  ├─ Guard Check        │
    │  ├─ Context Update     │
    │  └─ State Transition   │
    └────────┬───────────────┘
             │
             ↓
  ┌──────────────────────┐
  │ New State = 'pressed'│
  │ Context = {...}      │
  └──────────┬───────────┘
             │
             ↓
  ┌──────────────────────────────┐
  │ Style Map                    │
  │ 'pressed' → [               │
  │   'button-base',             │
  │   'button-active'            │
  │ ]                            │
  └──────────┬───────────────────┘
             │
             ↓
  ┌──────────────────────────────┐
  │ Apply Token Values           │
  │ ├─ background: {...}         │
  │ ├─ color: {...}              │
  │ └─ transform: {...}          │
  └──────────┬───────────────────┘
             │
             ↓
      ┌──────────────┐
      │  DOM Update  │
      │   (re-render)│
      └──────────────┘
```

## 7. Compound States & Hierarchies

Complex components use hierarchical (compound) state machines for organization:

```json
{
  "name": "Dialog",
  "stateMachine": {
    "id": "dialog",
    "initial": "closed",
    "states": {
      "closed": {
        "on": {
          "OPEN": "open"
        }
      },
      "open": {
        "type": "compound",
        "initial": "editing",
        "on": {
          "CLOSE": "closed"
        },
        "states": {
          "editing": {
            "on": {
              "SUBMIT": "confirming"
            }
          },
          "confirming": {
            "type": "parallel",
            "states": {
              "validation": {
                "on": {
                  "VALIDATED": "validated",
                  "INVALID": "editing"
                }
              },
              "submission": {
                "on": {
                  "SUCCESS": { "target": "#dialog.closed" },
                  "ERROR": "editing"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

State names with nesting: `open.editing`, `open.confirming.validation`, etc.

## 8. Parallel States

Parallel states allow independent substates running simultaneously:

```json
{
  "states": {
    "playing": {
      "type": "parallel",
      "states": {
        "audioTrack": {
          "initial": "playing",
          "states": {
            "playing": { "on": { "PAUSE": "paused" } },
            "paused": { "on": { "PLAY": "playing" } }
          }
        },
        "videoTrack": {
          "initial": "playing",
          "states": {
            "playing": { "on": { "PAUSE": "paused" } },
            "paused": { "on": { "PLAY": "playing" } }
          }
        }
      }
    }
  }
}
```

Both substates can change independently while in the parent `playing` state.

## 9. Conformance

A conforming state machine definition MUST:

1. Declare an `id` and `initial` state
2. Define all referenced states in `states` object
3. Ensure all `target` transitions reference valid states
4. Use consistent event naming (SCREAMING_SNAKE_CASE recommended)
5. Provide `description` for all states and major transitions
6. Include `styleMap` linking states to component-scoped tokens
7. Support guard functions that receive `context`, `event`, `state`
8. Validate context shape at machine initialization
9. Detect and report unreachable states
10. Support `entry` and `exit` actions for lifecycle hooks

## 10. References

- [XState Documentation](https://stately.ai/docs/xstate)
- [Zag.js Documentation](https://zagjs.com/)
- [Statecharts: A Visual Formalism for Complex Systems](https://www.sciencedirect.com/science/article/pii/0167642387900359) (David Harel)
- [W3C ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) — State machine patterns for accessible components
- [XState GitHub Repository](https://github.com/statelyai/xstate)
- [Zag.js GitHub Repository](https://github.com/chakra-ui/zag)
