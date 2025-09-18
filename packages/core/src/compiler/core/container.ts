// biome-ignore lint/suspicious/noExplicitAny: DI container needs any for type flexibility
type Constructor<T = object> = new (...args: unknown[]) => T;

const instances = new Map<Constructor<any>, any>();

export function inject<T>(ctor: Constructor<T>): T {
  const instance = instances.get(ctor);

  if (!instance) {
    const newInstance = new ctor();
    instances.set(ctor, newInstance);
    return newInstance;
  }

  return instance;
}
