export const ANSI_RESET = "\x1b[0m";
export const ANSI_GREY = "\x1b[90m";
export const ANSI_RED = "\x1b[91m";
export const ANSI_GREEN = "\x1b[92m";
export const ANSI_BOLD = "\x1b[1m";

export function getAnsiFromStyle(style: string): string {
  if (style.includes("red")) return ANSI_RED;
  if (style.includes("orange")) return "\x1b[38;5;208m";
  if (style.includes("yellow")) return "\x1b[33m";
  if (style.includes("green")) return ANSI_GREEN;
  if (style.includes("bold")) return ANSI_BOLD;
  return "";
}

export function ansiLog(): string {
  return `${ANSI_GREEN}${ANSI_BOLD}✏️ pencel${ANSI_RESET}`;
}

export function ansiError(): string {
  return `${ANSI_RED}${ANSI_BOLD}⛔ pencel${ANSI_RESET}`;
}

export function ansiTimestamp(timestamp: string): string {
  return `${ANSI_GREY}${timestamp}${ANSI_RESET}`;
}

export function ansiErrorLabel(): string {
  return `${ANSI_RED}${ANSI_BOLD}ERROR:${ANSI_RESET}`;
}

export function ansiStackTrace(text: string): string {
  return `${ANSI_GREY}${text}${ANSI_RESET}`;
}
