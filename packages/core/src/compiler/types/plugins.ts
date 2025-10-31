import type { SourceFile } from "typescript";
import type { FileIR } from "../ir/file.ts";
import type { ImplodeIRRefs, IRRef } from "../ir/irri.ts";

export interface BasePluginOptions {
  enabled?: boolean;
}

export interface PluginRegistry {
  _: object;
}

export type PluginNames = keyof Omit<PluginRegistry, "_">;

export type PluginOptionsOf<TName extends PluginNames> =
  PluginRegistry[TName] extends { options: infer TOptions & BasePluginOptions }
    ? TOptions
    : never;

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

/** Generate project-level files from the complete IR tree */
export type GenerateHook = {
  hook: "generate";
  irs: Array<ImplodeIRRefs<FileIR>>;
};

/** Derive framework-specific files from IR and source file */
export type DeriveHook = {
  hook: "derive";
  irr: IRRef<FileIR, SourceFile>;
};

/**
 * Union of all pluggable hooks in the system
 */
export type PluggableHooks =
  | CssPreprocessHook
  | CssPostprocessHook
  | GenerateHook
  | DeriveHook;

export type HookOf<TKind extends PluggableHooks["hook"]> = Extract<
  PluggableHooks,
  { hook: TKind }
>;

export type HookHandler<TKind extends PluggableHooks["hook"]> = (
  hook: HookOf<TKind>,
) => void | Promise<void>;

export type HookKind = PluggableHooks["hook"];
