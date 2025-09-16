import { isBrowser } from "./isBrowser.ts";
import { error } from "./log.ts";

export const throwWithCodeFrame = (
  errorMessage: string | string[],
  codeFrame: string,
): never => {
  const message = Array.isArray(errorMessage)
    ? errorMessage.join("\n")
    : errorMessage;

  // Show the code frame with styling
  if (isBrowser) {
    console.error(
      `%c${codeFrame}`,
      "font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; background: #2d2d2d; color: #f8f8f2; padding: 8px; border-radius: 4px; white-space: pre;",
    );
  } else {
    // For code frame in CLI, use plain console.error to preserve formatting
    console.error(codeFrame);
  }

  // Use our fancy error logging function for the main error message
  error(message, "font-weight: bold; color: #ff6b6b;");

  process.exit(1);
};
