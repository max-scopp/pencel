/**
 * Memoization utility - returns cached result unless dependencies change
 * Similar to React useMemo
 */
export function memo<T>(
  compute: () => T,
  deps: unknown[],
): { value: T; isDirty: boolean } {
  let cachedValue: T | undefined;
  let cachedDeps: unknown[] | undefined;
  let isDirty = true;

  // First call or deps changed
  if (cachedDeps === undefined || !depsEqual(cachedDeps, deps)) {
    cachedValue = compute();
    cachedDeps = deps;
    isDirty = true;
  } else {
    isDirty = false;
  }

  return { value: cachedValue as T, isDirty };
}

/**
 * Simple dependency comparison - shallow equality check
 */
function depsEqual(prevDeps: unknown[], nextDeps: unknown[]): boolean {
  if (prevDeps.length !== nextDeps.length) {
    return false;
  }

  for (let i = 0; i < prevDeps.length; i++) {
    if (prevDeps[i] !== nextDeps[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Stateful memo - stores value across multiple calls
 */
export class MemoCache<T> {
  private cachedValue: T | undefined;
  private cachedDeps: unknown[] | undefined;

  compute(compute: () => T, deps: unknown[]): T {
    // First call or deps changed
    if (this.cachedDeps === undefined || !depsEqual(this.cachedDeps, deps)) {
      this.cachedValue = compute();
      this.cachedDeps = deps;
    }

    if (this.cachedValue === undefined) {
      throw new Error("Memo compute failed to set cached value");
    }
    return this.cachedValue;
  }

  isDirty(nextDeps: unknown[]): boolean {
    return (
      this.cachedDeps === undefined || !depsEqual(this.cachedDeps, nextDeps)
    );
  }

  invalidate(): void {
    this.cachedDeps = undefined;
    this.cachedValue = undefined;
  }
}
