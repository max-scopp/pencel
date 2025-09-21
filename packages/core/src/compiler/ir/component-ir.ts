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

  constructor(sourceFile: SourceFile) {
    this.fileName = sourceFile.fileName;
  }
}
