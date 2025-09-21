export interface PencelRuntimeConfig {
  tagNamespace?: string | null;
  debug?: boolean;
}

export const pencelConfig: PencelRuntimeConfig = {
  tagNamespace: "pen",
};

export const pencilInit = (userConfig: PencelRuntimeConfig): void => {
  Object.assign(pencelConfig, userConfig);
  console.log("Pencil initialized");

  if (userConfig.debug) {
    globalThis.PENCIL_DEBUG = true;
  }
};
