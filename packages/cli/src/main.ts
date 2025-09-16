#!/usr/bin/env bun
import { log } from "@pencel/utils";
import { Cli } from "clipanion";
import pkg from "../package.json";
import { TransformCommand } from "./commands/transform.ts";

const [node, app, ...args] = process.argv;

/**
 * Main CLI function that runs commands or defaults to transform if config exists
 */
async function runCli() {
  log("Pencel Compiler CLI");

  const cli = new Cli({
    binaryName: `${node} ${app}`,
    binaryVersion: pkg.version,
  });

  cli.register(TransformCommand);
  cli.runExit(args);
}

runCli();
