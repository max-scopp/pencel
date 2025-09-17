export interface PencilRuntimeConfig {
  tagNamespace?: string | null;
  debug?: boolean;
}

export const pencilConfig: PencilRuntimeConfig = {
  tagNamespace: "pen",
};

export const pencilInit = (userConfig: PencilRuntimeConfig): void => {
  Object.assign(pencilConfig, userConfig);
  console.log("Pencil initialized");

  if (userConfig.debug) {
    globalThis.PENCIL_DEBUG = true;
  }
};
