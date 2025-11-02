import process from "node:process";
import { ansiLog } from "./getAnsiFromStyle.ts";
import { isBrowser } from "./isBrowser.ts";

interface ProgressState {
  isActive: boolean;
  lastOutput: string;
}

const progressState: ProgressState = {
  isActive: false,
  lastOutput: "",
};

/**
 * Clear any active progress bar before logging
 */
export function clearProgress(): void {
  if (!isBrowser && progressState.isActive && progressState.lastOutput) {
    // Clear the current line
    process.stdout.write(`\r${" ".repeat(progressState.lastOutput.length)}\r`);
    progressState.isActive = false;
    progressState.lastOutput = "";
  }
}

/**
 * Restore progress bar after logging other messages
 */
export function restoreProgress(): void {
  if (!isBrowser && progressState.lastOutput) {
    process.stdout.write(progressState.lastOutput);
    progressState.isActive = true;
  }
}

/**
 * Log a message that coordinates with progress bars
 */
export function coordLog(message: string): void {
  if (isBrowser) {
    console.log(message);
    return;
  }

  clearProgress();
  console.log(message);
  restoreProgress();
}

/**
 * Displays a percentage progress indicator that coordinates with other logging.
 * Only works in Node.js environment (not in browser).
 *
 * @param progress - A number between 0 and 1 representing the progress
 * @param options - Optional configuration for the progress display
 */
export function percentage(
  progress: number,
  options: {
    width?: number;
    prefix?: string;
  } = {},
): void {
  // Only work in Node.js, not in browser
  if (isBrowser) {
    return;
  }

  const { width = 30, prefix = "" } = options;

  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Calculate percentage
  const percentageValue = Math.round(clampedProgress * 100);

  // Create progress bar
  const filled = Math.floor(clampedProgress * width);
  const empty = width - filled;
  const bar = "█".repeat(filled) + " ".repeat(empty);

  // Build output string
  const output = `${ansiLog()} ${prefix} ${percentageValue}% [${bar}]`;

  // Clear previous progress if exists
  if (progressState.isActive && progressState.lastOutput) {
    process.stdout.write(`\r${" ".repeat(progressState.lastOutput.length)}\r`);
  }

  // Update state
  progressState.lastOutput = output;
  progressState.isActive = true;

  // Write new progress
  process.stdout.write(`\r${output}`);

  // If we've reached 100%, clear the progress bar completely
  if (clampedProgress >= 1) {
    process.stdout.write(`\r${" ".repeat(output.length)}\r`);
    progressState.isActive = false;
    progressState.lastOutput = "";
  }
}

/**
 * Creates a progress function that can be called multiple times to update progress.
 * Returns a function that takes a progress value (0-1) and updates the display.
 *
 * @param options - Configuration options for the progress display
 * @returns A function that updates the progress display
 */
export function createProgressIndicator(options: { width?: number; prefix?: string } = {}) {
  return (progress: number): void => percentage(progress, options);
}
