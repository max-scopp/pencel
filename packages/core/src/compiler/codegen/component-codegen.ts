import type { ComponentMetadata } from "../types/compiler-types";

export function generateComponentRegistration(
  metadata: ComponentMetadata,
  className: string,
): string {
  const { tagName, extends: extendsClass } = metadata;

  if (!tagName) {
    throw new Error("Component must have a tag name");
  }

  let registrationCode = "";

  if (extendsClass?.startsWith("HTML")) {
    // For customized built-in elements
    registrationCode = `
customElements.define('${tagName}', ${className}, { extends: '${extendsClass.toLowerCase()}' });
`;
  } else {
    // For autonomous custom elements
    registrationCode = `
customElements.define('${tagName}', ${className});
`;
  }

  return registrationCode;
}
