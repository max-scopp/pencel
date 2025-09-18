// Map to hold singletons
const singletons = new Map<Function, any>();

// inject function
export function inject<T>(cls: new (...args: any[]) => T): T {
  if (!singletons.has(cls)) {
    singletons.set(cls, new cls());
  }
  return singletons.get(cls);
}
