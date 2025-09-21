import type { PencelConfig } from "@pencel/core";

export class CompilerContext {
  #cwd!: string;
  #config!: PencelConfig;

  adopt(cwd: string, config: PencelConfig): Promise<void> {
    this.#cwd = cwd;
    this.#config = config;
    return Promise.resolve();
  }

  get cwd(): string {
    return this.#cwd;
  }

  get config(): PencelConfig {
    return this.#config;
  }
}
