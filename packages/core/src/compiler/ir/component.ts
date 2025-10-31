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
import type { StyleIR } from "./style.ts";

/**
 * ComponentIR is the flat IR representation of a component.
 * Contains both user-provided decorator options and compiler-resolved metadata as public readonly fields.
 *
 * ComponentIR = { tag, shadow, scoped, extends, formAssociated, normalizedTag, heritage, processedStyles, processedStyleUrls, props, events, methods, render }
 *
 * The IR is the single source of truth. Transformers extract a subset as [INTERNALS] for runtime decorator enrichment.
 */
export class ComponentIR extends IRM("Component") {
  readonly #config = inject(Config);

  // Metadata about the component in source
  readonly className: string;
  readonly fileName: string;

  // User-provided fields from @Component decorator
  readonly sourceTag: string;
  readonly shadow?: boolean;
  readonly scoped?: boolean;
  readonly extends?: string;
  readonly formAssociated?: boolean;

  // Compiler-resolved metadata (flat, alongside user fields)
  readonly normalizedTag: string;
  readonly heritage: string;
  readonly extendsTag: string | undefined;

  // Component members collected from class
  readonly props: Array<IRRef<PropertyIR, ts.PropertyDeclaration>>;
  readonly events: Array<IRRef<EventIR, ts.MethodDeclaration>>;
  readonly methods: Array<IRRef<MethodIR, ts.MethodDeclaration>>;
  readonly render?: IRRef<RenderIR, ts.MethodDeclaration>;

  // Mutable style fields, set via adoptStyles() after ComponentIR is created
  #processedStylesValue: string = "";
  #processedStyleUrlsValue: Record<string, string> = {};

  get processedStyles(): string {
    return this.#processedStylesValue;
  }

  get processedStyleUrls(): Record<string, string> {
    return this.#processedStyleUrlsValue;
  }

  /**
   * Constructs a ComponentIR from user source code.
   * Styles are attached later via adoptStyles() to break the circular dependency.
   *
   * @param sourceFile - TypeScript source file for context
   * @param classDeclaration - The component class declaration
   */
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

    // Store user-provided options as public fields
    this.sourceTag =
      componentOptions.tag ??
      throwError(
        `@Component for class ${this.className} must have a 'tag' property.`,
      );
    this.shadow = componentOptions.shadow ?? false;
    this.scoped = componentOptions.scoped ?? true;
    this.extends = componentOptions.extends;
    this.formAssociated = componentOptions.formAssociated;

    // Resolve compiler metadata and store directly as public fields
    this.normalizedTag = normalizeTag(
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

    this.extendsTag = getTagByExtendsString(this.heritage);

    // Collect component members
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

  /**
   * Attaches processed styles to this ComponentIR after it's been created.
   * This breaks the circular dependency: ComponentIR is created first, then
   * StyleIR is processed with the ComponentIR reference, then styles are adopted.
   *
   * @param styleIr - The processed StyleIR to adopt
   */
  adoptStyles(styleIr: StyleIR): void {
    this.#processedStylesValue = styleIr.processedStyles;
    this.#processedStyleUrlsValue = styleIr.processedStyleUrls;
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
