import type { SourceFile } from "ts-flattered";

export interface ComponentProperty {
  name: string;
  type: string;
  isRequired: boolean;
  defaultValue?: string;
  decoratorType: "Prop" | "State" | "Event";
}

export interface ComponentEvent {
  name: string;
  type: string;
  bubbles?: boolean;
}

export interface ComponentMethod {
  name: string;
  isPublic: boolean;
  decoratorType?: "Listen" | "Connected";
}

export class ComponentIR {
  public tag: string = "";
  public className: string = "";
  public fileName: string = "";
  public properties: ComponentProperty[] = [];
  public events: ComponentEvent[] = [];
  public methods: ComponentMethod[] = [];
  public styles: string[] = [];
  public styleUrls: string[] = [];

  constructor(public sourceFile: SourceFile) {
    this.fileName = sourceFile.fileName;
  }

  addProperty(property: ComponentProperty): void {
    this.properties.push(property);
  }

  addEvent(event: ComponentEvent): void {
    this.events.push(event);
  }

  addMethod(method: ComponentMethod): void {
    this.methods.push(method);
  }

  setComponentInfo(tag: string, className: string): void {
    this.tag = tag;
    this.className = className;
  }

  setStyles(styles: string[], styleUrls: string[]): void {
    this.styles = styles;
    this.styleUrls = styleUrls;
  }

  finalize(): void {
    // Validate and compute derived information
    if (!this.tag) {
      throw new Error(`Component ${this.className} missing tag`);
    }
    if (!this.className) {
      throw new Error(`Component missing class name in ${this.fileName}`);
    }
  }

  // Generate TypeScript declarations for global tag registration
  generateGlobalDeclaration(): string {
    const props = this.properties
      .filter((p) => p.decoratorType === "Prop")
      .map((p) => `    ${p.name}${p.isRequired ? "" : "?"}: ${p.type};`)
      .join("\n");

    const propsInterface = props
      ? `\n  interface ${this.className}Element extends HTMLElement {\n${props}\n  }\n`
      : "";

    return `${propsInterface}
  declare global {
    interface HTMLElementTagNameMap {
      '${this.tag}': ${this.className}Element${props ? "" : " & HTMLElement"};
    }
  }`;
  }
}
