import { getAnsiFromStyle } from "./getAnsiFromStyle.ts";
import { isBrowser } from "./isBrowser.ts";

export function log(message: string, style?: string): void {
  const now = new Date();
  const timestamp =
    now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) +
    "." +
    now.getMilliseconds().toString().padStart(3, "0");

  if (isBrowser) {
    console.log(
      `%c✏️ pencil%c ${timestamp} %c${message}`,
      "background: #118e67; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;",
      "color: grey;",
      style || "",
    );
  } else {
    const ansiGrey = "\x1b[90m"; // ANSI grey
    const ansiReset = "\x1b[0m";
    const ansiCode = style ? getAnsiFromStyle(style) : "";
    console.log(
      `${ansiGrey}${timestamp}${ansiReset} ${ansiCode}${message}\x1b[0m`,
    );
  }
}

export function createLog(
  namespace: string,
): (message: string, style?: string) => void {
  return (message: string, style?: string) => {
    const prefixedMessage = `[${namespace}] ${message}`;
    log(prefixedMessage, style);
  };
}
