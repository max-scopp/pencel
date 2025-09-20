// biome-ignore lint/suspicious/noExplicitAny: DI container needs any for type flexibility
type Constructor<T = object> = new (...args: any[]) => T;

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

export function register<T>(ctor: Constructor<T>, instance: T): void {
  if (instances.has(ctor)) {
    throw new Error(`Instance for ${ctor.name} is already registered.`);
  }

  instances.set(ctor, instance);
}
