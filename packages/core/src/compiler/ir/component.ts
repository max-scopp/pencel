import type { ComponentOptions } from "@pencel/runtime";
import {
  firstMap,
  getTagByExtendsString,
  normalizeTag,
  switchMapObject,
  throwError,
} from "@pencel/utils";
import type ts from "typescript";
import {
  type ClassDeclaration,
  type ClassElement,
  isMethodDeclaration,
  type MethodDeclaration,
  SyntaxKind,
} from "typescript";
import { decoratorArgs } from "../../ts-utils/decoratorArgs.ts";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import { Config } from "../config.ts";
import { inject } from "../core/container.ts";
import { EventIR } from "./event.ts";
import { IRM, IRRef } from "./irri.ts";
import { MethodIR } from "./method.ts";
import { PropertyIR } from "./prop.ts";
import { RenderIR } from "./render.ts";

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
   * The value of the `extends` keyword for the custom element.
   * E.g. HTMLButtonElement
   */
  readonly heritage: string;

  /**
   * The tag name if extending a built-in element.
   * E.g. `<button is="pencil-button">` would be "button"
   */
  readonly extends: string | undefined;

  readonly styles: string[];
  readonly styleUrls: StyleUrls;

  readonly props: Array<IRRef<PropertyIR, ts.PropertyDeclaration>>;
  readonly events: Array<IRRef<EventIR, ts.MethodDeclaration>>;
  readonly methods: Array<IRRef<MethodIR, ts.MethodDeclaration>>;
  readonly render?: IRRef<RenderIR, ts.MethodDeclaration>;

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

    this.heritage =
      firstMap(classDeclaration.heritageClauses, (hc) => {
        if (hc.token !== SyntaxKind.ExtendsKeyword) {
          return null;
        }

        const [typeNode] = hc.types;
        if (!typeNode) {
          return null;
        }

        const extendsName = typeNode.getText();

        if (!extendsName.startsWith("HTML")) {
          return null;
        }

        return extendsName;
      }) ??
      throwError(
        `Component class ${this.className} must extend a valid HTML element.`,
      );

    this.extends = getTagByExtendsString(this.heritage);

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

    const {
      properties,
      events,
      methods,
      render: [render],
    } = switchMapObject(classDeclaration.members, {
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
      render: (member) => {
        if (isPencelRenderMember(member)) {
          return new IRRef(new RenderIR(member), member);
        }
        return;
      },
    });

    this.props = properties;
    this.events = events;
    this.methods = methods;
    this.render = render;
  }
}

function isPencelRenderMember(
  member: ClassElement,
): member is MethodDeclaration {
  if (!isMethodDeclaration(member)) {
    return false;
  }

  if (member.name?.getText() === "render") {
    return true;
  }

  return false;
}
