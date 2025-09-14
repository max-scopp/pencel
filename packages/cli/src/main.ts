#!/usr/bin/env bun
import type { PencilConfig } from "@pencel/core";
import { log } from "@pencel/utils";
import { loadConfig } from "c12";
import { Cli, Command, Option } from "clipanion";
import pkg from "../package.json";
import { defaultConfig } from "./pencil.config";

/**
 * Checks if a Pencel config file exists in the current directory
 * @param configName The config file name to check
 * @returns True if config exists, false otherwise
 */
async function checkConfigExists(
  configName: string = "pencel.config",
): Promise<boolean> {
  try {
    const { config } = await loadConfig<PencilConfig>({
      name: "pencel",
      configFile: configName,
      defaults: defaultConfig,
      cwd: process.cwd(),
    });
    return !!config;
  } catch (_) {
    return false;
  }
}

class TransformCommand extends Command {
  static override paths = [["transform"]];

  config =
    Option.String("--config,-C", {
      description: "Path to config file (defaults to pencil.config)",
    }) ?? "pencel.config";

  async execute() {
    try {
      const { config } = await loadConfig<PencilConfig>({
        name: "pencel",
        configFile: this.config,
        defaults: defaultConfig,
        cwd: process.cwd(),
      });

      log(`Final config: ${JSON.stringify(config, null, 2)}`);
      return 0;
    } catch (error) {
      console.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 1;
    }
  }
}

class PencilCli extends Command {
  static override paths = [Command.Default];

  async execute() {
    log("Commands:");
    log("  transform - Transform a component file");
    log("Use `<command> --help` for more information");
    return 0;
  }
}

/**
 * Main CLI function that runs commands or defaults to transform if config exists
 */
async function runCli() {
  log("✏️  Pencel Compiler CLI");

  const cli = new Cli({
    binaryName: "pencel",
    binaryVersion: pkg.version,
  });

  cli.register(TransformCommand);
  cli.register(PencilCli);

  const args = process.argv.slice(2);

  // If no command specified and config exists, default to transform
  if (args.length === 0 && (await checkConfigExists())) {
    log("Found configuration file. Running transform command...");
    args.push("transform");
  }

  return cli.runExit(args);
}

runCli();
