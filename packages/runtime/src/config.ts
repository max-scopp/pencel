export interface PencelRuntimeConfig {
  tagNamespace?: string;
  debug?: boolean;
}

export const pencelConfig: PencelRuntimeConfig = {};

let _resolve: () => void, _reject: (e: unknown) => void;

export const ready$: Promise<void> = new Promise<void>((resolve, reject) => {
  const checkerId = setTimeout(() => {
    throw new Error(
      "Pencel runtime was not initialized. Make sure to call pencelInit()",
    );
  }, 3e3);

  _resolve = () => {
    clearTimeout(checkerId);
    resolve();
  };

  _reject = (e) => {
    clearTimeout(checkerId);
    reject(e);
  };
});

export const pencelInit = (userConfig: PencelRuntimeConfig): Promise<void> => {
  try {
    Object.assign(pencelConfig, userConfig);
    console.log("Pencel initialized");

    if (userConfig.debug) {
      globalThis.PENCIL_DEBUG = true;
    }

    _resolve();
  } catch (e) {
    _reject(e);
  }

  return ready$;
};
