import type {
  ClassDeclaration,
  Expression,
  JsxElement,
  JsxSelfClosingElement,
  SourceFile,
  Statement,
} from "typescript";
import type { CssPluginRegistry } from "../../plugins/css.ts";
import type { ComponentsExportGeneratorRegistry } from "../../plugins/generators/components.ts";
import type { IRGeneratorRegistry } from "../../plugins/generators/ir.ts";
import type { ComponentTypingsRegistry } from "../../plugins/generators/typings.ts";
import type { HostPluginRegistry } from "../../plugins/jsx-transform/host.ts";
import type { AngularOutputRegistry } from "../../plugins/outputs/angular.ts";
import type { ReactOutputRegistry } from "../../plugins/outputs/react.ts";
import type { ScssPluginRegistry } from "../../plugins/scss.ts";
import type { ComponentIR } from "../ir/component.ts";
import type { FileIR } from "../ir/file.ts";
import type { ImplodeIRRefs, IRRef } from "../ir/irri.ts";
import type { LoopContext } from "../transformers/render.loop.ts";

export interface BasePluginOptions {
  enabled?: boolean;
}

export interface PluginRegistry
  extends ComponentsExportGeneratorRegistry,
    IRGeneratorRegistry,
    ComponentTypingsRegistry,
    CssPluginRegistry,
    ScssPluginRegistry,
    ReactOutputRegistry,
    AngularOutputRegistry,
    HostPluginRegistry {
  _: object;
}

export type PluginNames = keyof Omit<PluginRegistry, "_">;

export type PluginOptionsOf<TName extends PluginNames> =
  PluginRegistry[TName] extends { options: infer TOptions & BasePluginOptions }
    ? TOptions
    : never;

export type PluginDef =
  | PluginNames
  | {
      [K in PluginNames]: {
        name: K;
        options?: PluginOptionsOf<K>;
      };
    }[PluginNames];

export type PluginDefs = Array<PluginDef>;

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
  irr?: IRRef<ComponentIR, ClassDeclaration>;
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

/** Transform JSX elements during render compilation */
export type JsxTransformHook = {
  hook: "jsx:transform";
  tagName: string;
  attributes: unknown;
  jsxNode: JsxElement | JsxSelfClosingElement;
  loopContext: LoopContext | undefined;
  hierarchicalScopeKey: Expression | null;
  transformExpression: (expr: Expression) => Expression;
  prependStatements: Statement[];
  result?: Expression;
};

/**
 * Union of all pluggable hooks in the system
 */
export type PluggableHooks =
  | CssPreprocessHook
  | CssPostprocessHook
  | GenerateHook
  | DeriveHook
  | JsxTransformHook;

export type HookOf<TKind extends PluggableHooks["hook"]> = Extract<
  PluggableHooks,
  { hook: TKind }
>;

export type HookHandler<TKind extends PluggableHooks["hook"]> = (
  hook: HookOf<TKind>,
) => void | Promise<void>;

export type HookKind = PluggableHooks["hook"];
