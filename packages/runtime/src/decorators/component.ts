import { getExtendsByInheritance } from "@pencil/utils";
import { pencilConfig } from "src/config.ts";

export const Component = (_options: ComponentOptions): ClassDecorator => {
  return (klass: any) => {
    if (typeof customElements === "undefined") {
      console.log(
        "Skipping customElements.define: not supported in this environment",
      );
      return klass;
    }

    const tagName = [pencilConfig.tagNamespace, _options.tagName]
      .filter(Boolean)
      .join("-");

    const extendsByInheritance = getExtendsByInheritance(klass);

    console.log("Registering:", tagName, "extends:", extendsByInheritance);

    if (extendsByInheritance) {
      // Customized built-in element
      customElements.define(tagName, klass, { extends: extendsByInheritance });
    } else {
      // Autonomous custom element
      customElements.define(tagName, klass);
    }

    return klass;
  };
};

export interface ComponentOptions {
  tagName?: string;
}
