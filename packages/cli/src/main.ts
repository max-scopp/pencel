#!/usr/bin/env bun
import { type PencilConfig, transformToWebComponent } from "@pencel/core";
import { Cli, Command, Option } from "clipanion";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { defaultConfig } from "./pencil.config";

class TransformCommand extends Command {
  static override paths = [["transform"]];

  file = Option.String("--file,-f", {
    description: "The file to transform",
  });

  output = Option.String("--output,-o", {
    description: "Output file path (defaults to stdout)",
  });

  config = Option.String("--config,-c", {
    description: "Path to config file",
  });

  async execute() {
    if (!this.file) {
      console.error("Error: --file is required");
      return 1;
    }

    try {
      // Load config
      const config: PencilConfig = {
        ...defaultConfig,
        tagNamespace: this.config ? "my-app-" : "", // Demo: use namespace if config file specified
      };

      console.log(`Loaded config: ${JSON.stringify(config, null, 2)}\n`);

      const filePath = resolve(this.file);
      const fileContents = readFileSync(filePath, "utf-8");

      const result = transformToWebComponent(fileContents, config);

      if (this.output) {
        const outputPath = resolve(this.output);
        writeFileSync(outputPath, result.code);
        console.log(`Transformed code written to ${outputPath}`);
        console.log(`Metadata: ${JSON.stringify(result.metadata, null, 2)}`);
      } else {
        console.log("=== Original Code ===");
        console.log(fileContents);
        console.log("\n=== Transformed Code ===");
        console.log(result.code);
        console.log("\n=== Metadata ===");
        console.log(JSON.stringify(result.metadata, null, 2));
      }

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
    console.log("Pencil Compiler CLI\n");
    console.log("Commands:");
    console.log("  transform - Transform a component file\n");
    console.log("Use `<command> --help` for more information");
    return 0;
  }
}

const cli = new Cli({
  binaryName: "pencil",
  binaryVersion: "0.0.1",
});

cli.register(TransformCommand);
cli.register(PencilCli);

cli.runExit(process.argv.slice(2));
