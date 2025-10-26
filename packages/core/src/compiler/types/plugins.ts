import type ts from "typescript";

export interface PluginRegistry {
  _: object;
}

export type PluginNames = keyof Omit<PluginRegistry, "_">;

export type PluginOptionsOf<TName extends PluginNames> =
  PluginRegistry[TName] extends { options: infer TOptions } ? TOptions : never;

export type PluginDefs<
  TPlugin extends PluginNames = PluginNames,
  TOptions extends object = never,
> = Array<
  | TPlugin
  | {
      name: TPlugin;
      options?: TOptions;
    }
>;

/** Transform user styles to standard CSS */
export type CssPreprocessHook = {
  hook: "css:preprocess";
  input: string;
  path: string;
};

/** Transform standard CSS to optimized CSS */
export type CssPostprocessHook = {
  hook: "css:postprocess";
  input: string;
  path: string;
};

/** Generate code from TypeScript AST (mutable) */
export type CodegenHook = {
  hook: "codegen";
  input: ts.SourceFile;
};

/**
 * Union of all pluggable hooks in the system
 */
export type PluggableHooks =
  | CssPreprocessHook
  | CssPostprocessHook
  | CodegenHook;

export type HookOf<TKind extends PluggableHooks["hook"]> = Extract<
  PluggableHooks,
  { hook: TKind }
>;

export type HookHandler<TKind extends PluggableHooks["hook"]> = (
  hook: HookOf<TKind>,
) => void | Promise<void>;

export type HookKind = PluggableHooks["hook"];
