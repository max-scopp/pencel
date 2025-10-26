import type { Node } from "typescript";
import { inject } from "../core/container.ts";
import type { ComponentIR } from "./component.ts";
import type { EventIR } from "./event.ts";
import type { FileIR } from "./file.ts";
import type { MethodIR } from "./method.ts";
import type { PropertyIR } from "./prop.ts";
import type { RenderIR } from "./render.ts";

export type IRKind = keyof KnownIRs;

export type KnownIRs = {
  File: FileIR;
  Component: ComponentIR;
  Prop: PropertyIR;
  Method: MethodIR;
  Event: EventIR;
  Render: RenderIR;
};

/**
 *  Recursively unwraps IRRef<T> to T through object trees and arrays
 */
export type ImplodeIRRef<T> = T extends IRRef<infer U, infer _N extends Node>
  ? ImplodeIRRef<U>
  : T extends (infer U)[]
    ? ImplodeIRRef<U>[]
    : T extends object
      ? {
          [K in keyof T]: ImplodeIRRef<T[K]>;
        }
      : T;

/**
 * Each Intermediate Representation can vary highly in structure and purpose.
 * This interface serves as a base type for all IR kinds, providing a
 * way to identify the specific type of IR.
 */
export interface IR {
  kind: IRKind;
}

/**
 * Intermediate Representation Mixin.
 * Creates a class that implements the IR interface of the specified kind.
 */
export function IRM(kind: IRKind) {
  return class implements IR {
    kind = kind;
  };
}

/**
 * Container interface that holds a reference to an IR instance along with
 * its associated AST node and children.
 */
export class IRRef<T extends IR, TNode extends Node> {
  constructor(
    readonly ir: T,
    readonly node: TNode,
  ) {
    inject(IRRI).register(this);
  }
}

/**
 * Intermediate Representation Reference Index
 */
export class IRRI {
  #all = new Set<IRRef<IR, Node>>();
  #byKind = new Map<IRKind, Set<IRRef<IR, Node>>>();

  register<TIR extends IR, TNode extends Node>(irr: IRRef<TIR, TNode>) {
    this.#all.add(irr);

    let bucket = this.#byKind.get(irr.ir.kind);

    if (!bucket) {
      bucket = new Set();
      this.#byKind.set(irr.ir.kind, bucket);
    }

    bucket.add(irr);
  }

  allByKind<K extends IRKind>(kind: K): IRRef<KnownIRs[K], Node>[] {
    const bucket = this.#byKind.get(kind);
    if (!bucket) return [];
    return [...bucket] as IRRef<KnownIRs[K], Node>[];
  }

  firstIrr<K extends IRKind>(
    kind: K,
    filterFn: (item: KnownIRs[K]) => boolean,
  ) {
    const bucket = this.#byKind.get(kind);

    if (!bucket) {
      throw new Error(`No IR bucket for kind '${kind}'`);
    }

    for (const irr of bucket) {
      const result = filterFn(irr.ir as KnownIRs[K]);
      if (result) return irr as IRRef<KnownIRs[K], Node>;
    }

    throw new Error(`firstIr: no matching IR of kind '${kind}'`);
  }

  /**
   *  Unwraps IRRef instances and removes AST nodes for serialization
   */
  implode<T>(value: T): ImplodeIRRef<T> {
    const seen = new WeakSet<object>();

    const implodeValue = (val: unknown): unknown => {
      if (val === null || typeof val !== "object") return val;

      if (seen.has(val)) return null;
      seen.add(val);

      if (val instanceof IRRef) {
        return implodeValue((val as IRRef<IR, Node>).ir);
      }

      if (Array.isArray(val)) return val.map(implodeValue);

      if (Object.getPrototypeOf(val) === Object.prototype) {
        const result: Record<string, unknown> = {};
        for (const key in val) {
          if (Object.prototype.propertyIsEnumerable.call(val, key)) {
            result[key] = implodeValue((val as Record<string, unknown>)[key]);
          }
        }
        return result;
      }

      if (val.constructor && val.constructor !== Object) {
        const result: Record<string, unknown> = {};
        for (const key of Object.getOwnPropertyNames(val)) {
          try {
            result[key] = implodeValue((val as Record<string, unknown>)[key]);
          } catch {
            // Skip inaccessible properties
          }
        }
        return result;
      }

      return val;
    };

    return implodeValue(value) as ImplodeIRRef<T>;
  }
}
