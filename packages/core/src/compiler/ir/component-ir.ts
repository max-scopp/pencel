import { isNumberObject } from "node:util/types";
import type { SourceFile } from "ts-flattered";
import { Config } from "../config/config.ts";
import { inject } from "../core/container.ts";
import { IR } from "./ir.ts";

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
  readonly #ir = inject(IR);
  readonly #config = inject(Config);
  #sourceTag: string = "";

  get tag(): string {
    return [this.#config.config.runtime.tagNamespace, this.#sourceTag].join(
      "-",
    );
  }

  set tag(value: string) {
    this.#sourceTag = value;
  }

  /**
   * The value of the `extends` attribute for the custom element.
   * E.g. HTMLButtonElement
   */
  public extends: string = "";

  /**
   * The tag name for the "is" attribute if extending a built-in element.
   * E.g. `<button is="pencil-button">` would be "button"
   */
  public forIs: string | undefined = "";

  public className: string = "";
  public fileName: string = "";
  public properties: ComponentProperty[] = [];
  public events: ComponentEvent[] = [];
  public methods: ComponentMethod[] = [];
  public styles: string[] = [];
  public styleUrls: string[] = [];

  constructor(public sourceFile: SourceFile) {
    this.fileName = sourceFile.fileName;
    this.#ir.components.push(this);
  }
}
