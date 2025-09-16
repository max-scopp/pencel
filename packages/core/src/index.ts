export * from "./compiler/api/index.ts";
export { validatePluginNames } from "./compiler/core/plugin.js";
export type {
  createPluginConfig,
  PluginConfig,
  PluginName,
  PluginOptions,
  PluginsList,
  RegisteredPluginName,
  validatePluginConfigs,
} from "./compiler/types/plugins.js";
import "./plugins.ts";
