export function getAnsiFromStyle(style: string): string {
  if (style.includes("red")) return "\x1b[31m";
  if (style.includes("orange")) return "\x1b[38;5;208m";
  if (style.includes("yellow")) return "\x1b[33m";
  if (style.includes("bold")) return "\x1b[1m";
  return "";
}
