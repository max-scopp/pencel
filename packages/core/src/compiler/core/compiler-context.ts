import { throwError } from "@pencel/utils";
import type { PencelConfig } from "../types/config-types.ts";

export class CompilerContext {
  #cwd?: string;
  #config?: Required<PencelConfig>;

  adopt(cwd: string, config: Required<PencelConfig>): Promise<void> {
    this.#cwd = cwd;
    this.#config = config;
    return Promise.resolve();
  }

  get cwd(): string {
    return this.#cwd ?? throwError("CWD not set. Call adopt() first.");
  }

  get config(): Required<PencelConfig> {
    return this.#config ?? throwError("Config not set. Call adopt() first.");
  }
}
