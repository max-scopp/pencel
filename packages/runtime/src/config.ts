export interface PencilRuntimeConfig {
  tagNamespace?: string;
}

export const pencilConfig: PencilRuntimeConfig = {
  tagNamespace: "pen",
};

export const pencilInit = (userConfig: PencilRuntimeConfig): void => {
  Object.assign(pencilConfig, userConfig);
  console.log("Pencil initialized");
};
