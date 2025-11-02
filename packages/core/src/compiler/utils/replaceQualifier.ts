export function replaceQualifier(path: string, inputQualifier: string, outputQualifier: string): string {
  return path.replace(new RegExp(`\\.${inputQualifier}(?=\\.[^.]+$)`), `.${outputQualifier}`);
}
