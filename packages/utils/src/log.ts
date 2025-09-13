import { getAnsiFromStyle } from "./getAnsiFromStyle.ts";
import { isBrowser } from "./isBrowser.ts";

const PENCIL_DO_LOGGING = () =>
  import.meta.env?.PROD
    ? false
    : ((globalThis.PENCIL_DEBUG ||
        new URLSearchParams(window.location.search).get("pencilDebug")) ??
      true);

export function log(
  message: string,
  style?: string,
  ...other: unknown[]
): void {
  if (!PENCIL_DO_LOGGING()) {
    return;
  }

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
      ...other,
    );
  } else {
    const ansiGrey = "\x1b[90m"; // ANSI grey
    const ansiReset = "\x1b[0m";
    const ansiCode = style ? getAnsiFromStyle(style) : "";
    console.log(
      `${ansiGrey}${timestamp}${ansiReset} ${ansiCode}${message}\x1b[0m`,
      ...other,
    );
  }
}

export function createLog(
  namespace: string,
): (message: string, style?: string, ...other: unknown[]) => void {
  return (message: string, style?: string, ...other: unknown[]) => {
    const prefixedMessage = `[${namespace}] ${message}`;
    log(prefixedMessage, style, ...other);
  };
}
