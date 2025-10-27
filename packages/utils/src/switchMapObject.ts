export function switchMapObject<
  TItem,
  TCases extends Record<string, (item: TItem) => unknown | undefined | null>,
>(
  items: readonly TItem[],
  cases: TCases,
): { [K in keyof TCases]: Exclude<ReturnType<TCases[K]>, undefined | null>[] } {
  const result = {} as {
    [K in keyof TCases]: Exclude<ReturnType<TCases[K]>, undefined | null>[];
  };

  for (const key in cases) {
    const typedKey = key as keyof TCases;
    result[typedKey] = [];
  }

  for (const item of items) {
    for (const key in cases) {
      const typedKey = key as keyof TCases;
      const mapped = cases[typedKey](item);
      if (mapped != null) {
        result[typedKey].push(
          mapped as Exclude<
            ReturnType<TCases[typeof typedKey]>,
            null | undefined
          >,
        );
      }
    }
  }

  return result;
}
