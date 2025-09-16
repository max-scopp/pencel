import { ansiLog } from "./getAnsiFromStyle.ts";
import { isBrowser } from "./isBrowser.ts";

/**
 * Displays a percentage progress indicator that updates the current terminal line.
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

  // Use carriage return to overwrite the current line
  process.stdout.write(`\r${output}`);

  // If we've reached 100%, clear the entire line
  if (clampedProgress >= 1) {
    process.stdout.write(`\r${" ".repeat(output.length)}\r`);
  }
}

/**
 * Creates a progress function that can be called multiple times to update progress.
 * Returns a function that takes a progress value (0-1) and updates the display.
 *
 * @param options - Configuration options for the progress display
 * @returns A function that updates the progress display
 */
export function createProgressIndicator(
  options: { width?: number; prefix?: string } = {},
) {
  return (progress: number): void => percentage(progress, options);
}
