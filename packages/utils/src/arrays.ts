export function single<
  TItem,
  TArray extends Array<TItem> | ReadonlyArray<TItem>,
>(arr: TArray | null | undefined): TItem {
  if (!arr || arr.length !== 1) throw new Error("Expected exactly one element");
  return arr[0];
}

/** Returns the first non-null/undefined mapped value, or undefined if none found */
export function firstMap<TItem, TMapped>(
  arr: Array<TItem> | ReadonlyArray<TItem> | null | undefined,
  filterMapFn: (item: TItem) => TMapped | null | undefined,
): TMapped | undefined {
  if (!arr) return;

  for (const item of arr) {
    const mapped = filterMapFn(item);
    if (mapped != null) return mapped;
  }

  return;
}

/** Returns value if not null/undefined, otherwise the default */
export function defaultable<T, TDefault = T | undefined>(
  value: T | null | undefined,
  defaultValue: TDefault,
): T | TDefault {
  return value != null ? value : defaultValue;
}

/** Combines firstMap + defaultable */
export function firstMapOrDefault<
  TItem,
  TMapped,
  TDefault = TMapped | undefined,
>(
  arr: Array<TItem> | ReadonlyArray<TItem> | null | undefined,
  filterMapFn: (item: TItem) => TMapped | null | undefined,
  defaultValue: TDefault,
): TMapped | TDefault {
  return defaultable(firstMap(arr, filterMapFn), defaultValue);
}

/** Maps all items and filters out null/undefined results */
export function filterMap<TItem, TMapped>(
  arr: Array<TItem> | ReadonlyArray<TItem> | null | undefined,
  filterMapFn: (item: TItem) => TMapped | null | undefined,
): TMapped[] {
  if (!arr) return [];
  const result: TMapped[] = [];
  for (const item of arr) {
    const mapped = filterMapFn(item);
    if (mapped != null) result.push(mapped);
  }
  return result;
}
