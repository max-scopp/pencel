export function getExtendsByInheritance(klass: Function): string | undefined {
  let proto = klass.prototype;

  while (proto) {
    const ctor = proto.constructor;

    for (const key of Object.getOwnPropertyNames(window)) {
      if (!key.startsWith("HTML") || !key.endsWith("Element")) continue;

      const builtIn = (window as any)[key];
      if (ctor === builtIn) {
        // e.g. HTMLButtonElement → "button"
        return key.replace(/^HTML|Element$/g, "").toLowerCase() || undefined;
      }
    }

    if (ctor === HTMLElement) return undefined; // reached base HTMLElement → autonomous

    proto = Object.getPrototypeOf(proto);
  }

  return undefined;
}
