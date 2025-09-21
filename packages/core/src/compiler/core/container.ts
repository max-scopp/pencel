// biome-ignore lint/suspicious/noExplicitAny: DI container needs any for type flexibility
type Constructor<T = object> = new (...args: any[]) => T;

// biome-ignore lint/suspicious/noExplicitAny: Container needs to handle any constructor type
const instances = new Map<Constructor<any>, any>();
// biome-ignore lint/suspicious/noExplicitAny: Need to track any constructor type being instantiated
const instantiating = new Set<Constructor<any>>(); // Track currently instantiating constructors
// biome-ignore lint/suspicious/noExplicitAny: Promise can resolve to any type from constructor
const pending = new Map<Constructor<any>, Promise<any>>(); // Track pending promises for lazy init

export function inject<T>(ctor: Constructor<T>): T {
  const existingInstance = instances.get(ctor);
  if (existingInstance) {
    return existingInstance;
  }

  if (instantiating.has(ctor)) {
    throw new Error(
      `Circular dependency detected: ${ctor.name} is already being instantiated. ` +
        `Currently instantiating: [${Array.from(instantiating)
          .map((c) => c.name)
          .join(" -> ")}]`,
    );
  }

  const pendingPromise = pending.get(ctor);
  if (pendingPromise) {
    throw new Error(
      `Attempted to inject ${ctor.name} while it's still being instantiated asynchronously. ` +
        `Consider using injectLazy() for circular dependencies.`,
    );
  }

  instantiating.add(ctor);

  try {
    const newInstance = new ctor();
    instances.set(ctor, newInstance);
    return newInstance;
  } catch (error) {
    instances.delete(ctor);
    throw error;
  } finally {
    instantiating.delete(ctor);
  }
}

export function injectLazy<T>(ctor: Constructor<T>): () => T {
  return () => inject(ctor);
}

export function register<T>(ctor: Constructor<T>, instance: T): void {
  if (instances.has(ctor)) {
    throw new Error(`Instance for ${ctor.name} is already registered.`);
  }

  instances.set(ctor, instance);
}

export function clear(): void {
  instances.clear();
  instantiating.clear();
  pending.clear();
}
