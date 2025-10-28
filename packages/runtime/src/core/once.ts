const _onceCache = new WeakMap<() => unknown, unknown>();

export function once<T>(factory: () => T): T {
  if (_onceCache.has(factory)) {
    return _onceCache.get(factory) as T;
  }

  const v = factory();

  _onceCache.set(factory, v);

  return v;
}
