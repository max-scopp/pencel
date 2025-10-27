import type { ASTNode } from "./node.ts";

export type ASTRecord<T> = T extends (...args: any[]) => any
  ? ASTNode
  : T extends Array<infer U>
    ? ASTRecord<U>[]
    : T extends object
      ? { [K in keyof T]: ASTRecord<T[K]> }
      : T;

export type ASTArgsFrom<TArgs extends readonly unknown[]> = {
  [K in keyof TArgs]: TArgs[K] extends object ? ASTRecord<TArgs[K]> : TArgs[K];
};
