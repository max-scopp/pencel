function findFirstDifference(a: string, b: string): number {
  const minLen = Math.min(a.length, b.length);
  for (let i = 0; i < minLen; i++) {
    if (a[i] !== b[i]) return i;
  }
  return minLen;
}

function excerptAround(
  str: string,
  centerIdx: number,
  maxLen: number = 25,
): string {
  if (str.length <= maxLen) return str;

  const halfLen = Math.floor(maxLen / 2);
  let start = Math.max(0, centerIdx - halfLen);
  const end = Math.min(str.length, start + maxLen);

  // Adjust if we hit the end
  if (end - start < maxLen) {
    start = Math.max(0, end - maxLen);
  }

  const prefix = start > 0 ? "…" : "";
  const suffix = end < str.length ? "…" : "";

  return `${prefix}${str.substring(start, end)}${suffix}`;
}

export function fromToText(
  propertyName: string,
  from: unknown,
  to: unknown,
): string {
  const fromStr = JSON.stringify(from);
  const toStr = JSON.stringify(to);

  const diffIdx = findFirstDifference(fromStr, toStr);
  const fromDisplay = excerptAround(fromStr, diffIdx, 25);
  const toDisplay = excerptAround(toStr, diffIdx, 25);
  return `${propertyName}: ${fromDisplay} → ${toDisplay}`;
}
