export const PENCIL_LOG = "\x1b[92m\x1b[1m✏️ pencil\x1b[0m";
export const PENCIL_ERROR = "\x1b[91m\x1b[1m⛔ pencil\x1b[0m";
export const ERROR_LABEL = "\x1b[91m\x1b[1mERROR:\x1b[0m";

export const ANSI_RESET = "\x1b[0m";
export const ANSI_BOLD = "\x1b[1m";

export function getAnsiFromStyle(style: string): string {
  if (style.includes("red")) return "\x1b[91m";
  if (style.includes("orange")) return "\x1b[38;5;208m";
  if (style.includes("yellow")) return "\x1b[33m";
  if (style.includes("green")) return "\x1b[92m";
  if (style.includes("grey") || style.includes("gray")) return "\x1b[90m";

  return "";
}

export function ansiTimestamp(timestamp: string): string {
  return `${getAnsiFromStyle("grey")}${timestamp}${ANSI_RESET}`;
}

export function ansiStackTrace(text: string): string {
  return `${getAnsiFromStyle("grey")}${text}${ANSI_RESET}`;
}
