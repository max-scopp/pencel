export function normalizeTag(tag: string, namespace: string = "pen"): string {
  if (tag.startsWith(`${namespace}-`)) {
    return tag;
  }

  return `${namespace}-${tag}`;
}
