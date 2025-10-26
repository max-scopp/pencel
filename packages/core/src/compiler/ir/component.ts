import type { ComponentOptions } from "@pencel/runtime";
import {
  firstMap,
  getTagByExtendsString,
  normalizeTag,
  switchMapObject,
  throwError,
} from "@pencel/utils";
import type ts from "typescript";
import { type ClassDeclaration, SyntaxKind } from "typescript";
import { decoratorArgs } from "../../ts-utils/decoratorArgs.ts";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import { Config } from "../config.ts";
import { inject } from "../core/container.ts";
import { EventIR } from "./event.ts";
import { MethodIR } from "./method.ts";
import { PropertyIR } from "./prop.ts";
import { IRM, IRRef } from "./ref.ts";

export type ComponentEvent = {};

export interface ComponentMethod {
  name: string;
  isPublic: boolean;
  decoratorType?: "Listen" | "Connected";
}

type StyleUrls = {
  __default?: string;
} & Record<string, string>;

export class ComponentIR extends IRM("Component") {
  readonly #config = inject(Config);

  readonly className: string;
  readonly fileName: string;

  readonly sourceTag: string;
  readonly tag: string;

  /**
   * The value of the `extends` attribute for the custom element.
   * E.g. HTMLButtonElement
   */
  readonly extends: string;

  /**
   * The tag name for the "is" attribute if extending a built-in element.
   * E.g. `<button is="pencil-button">` would be "button"
   */
  readonly forIs: string | undefined;

  readonly styles: string[];
  readonly styleUrls: StyleUrls;

  readonly props: Array<IRRef<PropertyIR, ts.PropertyDeclaration>>;
  readonly events: Array<IRRef<EventIR, ts.MethodDeclaration>>;
  readonly methods: Array<IRRef<MethodIR, ts.MethodDeclaration>>;

  constructor(sourceFile: ts.SourceFile, classDeclaration: ClassDeclaration) {
    super();

    const decorator = singleDecorator(classDeclaration, "Component");
    const [componentOptions] =
      decoratorArgs<readonly [ComponentOptions]>(decorator) ??
      throwError(`@Component decorator must have options object.`);

    this.fileName = sourceFile.fileName;
    this.className =
      classDeclaration.name?.text ??
      throwError("A component must have a class name.");

    this.sourceTag =
      componentOptions.tag ??
      throwError(
        `@Component for class ${this.className} must have a 'tag' property.`,
      );

    this.tag = normalizeTag(
      this.sourceTag,
      this.#config.user.runtime.tagNamespace,
    );

    this.extends =
      firstMap(classDeclaration.heritageClauses, (hc) => {
        const correctExtends =
          hc.token === SyntaxKind.ExtendsKeyword &&
          hc.getText().startsWith("HTML");

        if (correctExtends) {
          return hc.getText();
        }

        return null;
      }) ??
      throwError(
        `Component class ${this.className} must extend a valid HTML element.`,
      );

    this.forIs = getTagByExtendsString(this.extends);

    this.styles = Array.isArray(componentOptions.styles)
      ? componentOptions.styles
      : componentOptions.styles
        ? [componentOptions.styles]
        : [];

    this.styleUrls = {
      ...componentOptions.styleUrls,
      ...(typeof componentOptions.styleUrl === "string" && {
        __default: componentOptions.styleUrl,
      }),
    };

    const { properties, events, methods } = switchMapObject(
      classDeclaration.members,
      {
        properties: (member) => {
          if (PropertyIR.isPencelPropMember(member)) {
            return new IRRef(new PropertyIR(member), member);
          }
          return;
        },
        events: (member) => {
          if (EventIR.isPencelEventMember(member)) {
            return new IRRef(new EventIR(member), member);
          }
          return;
        },
        methods: (member) => {
          if (MethodIR.isPencelMethodMember(member)) {
            return new IRRef(new MethodIR(member), member);
          }
          return;
        },
      },
    );

    this.props = properties;
    this.events = events;
    this.methods = methods;
  }
}
