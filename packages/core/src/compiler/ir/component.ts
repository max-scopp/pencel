import type { ComponentOptions } from "@pencel/runtime";
import { firstMap, getTagByExtendsString, normalizeTag, switchMapObject, throwError } from "@pencel/utils";
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
import { StateIR } from "./state.ts";
import type { StyleIR } from "./style.ts";

export class ComponentIR extends IRM("Component") {
  readonly #config = inject(Config);

  readonly className: string;
  readonly fileName: string;

  readonly sourceTag: string;
  readonly shadow?: boolean;
  readonly scoped?: boolean;
  readonly extends?: string;
  readonly formAssociated?: boolean;

  readonly normalizedTag: string;
  readonly heritage: string;
  readonly extendsTag: string | undefined;

  readonly props: Array<IRRef<PropertyIR, ts.PropertyDeclaration>>;
  readonly state: Array<IRRef<StateIR, ts.PropertyDeclaration>>;
  readonly events: Array<IRRef<EventIR, ts.PropertyDeclaration>>;
  readonly methods: Array<IRRef<MethodIR, ts.MethodDeclaration>>;
  readonly render?: IRRef<RenderIR, ts.MethodDeclaration>;

  #processedStylesValue: string = "";
  #processedStyleUrlsValue: Record<string, string> = {};

  get processedStyles(): string {
    return this.#processedStylesValue;
  }

  get processedStyleUrls(): Record<string, string> {
    return this.#processedStyleUrlsValue;
  }

  /**
   * Constructs a ComponentIR from user source code; styles are attached later via adoptStyles().
   */
  constructor(sourceFile: ts.SourceFile, classDeclaration: ClassDeclaration) {
    super();

    const decorator = singleDecorator(classDeclaration, "Component");
    const [componentOptions] =
      decoratorArgs<readonly [ComponentOptions]>(decorator) ??
      throwError(`@Component decorator must have options object.`);

    this.fileName = sourceFile.fileName;
    this.className = classDeclaration.name?.text ?? throwError("A component must have a class name.");

    this.sourceTag =
      componentOptions.tag ?? throwError(`@Component for class ${this.className} must have a 'tag' property.`);
    this.shadow = componentOptions.shadow ?? false;
    this.scoped = componentOptions.scoped ?? true;
    this.extends = componentOptions.extends;
    this.formAssociated = componentOptions.formAssociated;

    this.normalizedTag = normalizeTag(this.sourceTag, this.#config.user.runtime.tagNamespace);

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
      }) ?? throwError(`Component class ${this.className} must extend a valid HTML element.`);

    this.extendsTag = getTagByExtendsString(this.heritage);

    // Collect component members
    const {
      properties,
      state,
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
      state: (member) => {
        if (StateIR.isPencelStateMember(member)) {
          return new IRRef(new StateIR(member), member);
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
    this.state = state;
    this.events = events;
    this.methods = methods;
    this.render = render;
  }

  /**
   * Attaches processed styles to this ComponentIR after creation to break circular dependency.
   */
  adoptStyles(styleIr: StyleIR): void {
    this.#processedStylesValue = styleIr.processedStyles;
    this.#processedStyleUrlsValue = styleIr.processedStyleUrls;
  }
}

function isPencelRenderMember(member: ClassElement): member is MethodDeclaration {
  if (!isMethodDeclaration(member)) {
    return false;
  }

  if (member.name?.getText() === "render") {
    return true;
  }

  return false;
}
