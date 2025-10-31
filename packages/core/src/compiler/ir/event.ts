import type { EventOptions } from "@pencel/runtime";
import { throwError } from "@pencel/utils";
import {
  type ClassElement,
  isPropertyDeclaration,
  type PropertyDeclaration,
} from "typescript";
import { decoratorArgs } from "../../ts-utils/decoratorArgs.ts";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import { IRM } from "./irri.ts";

export class EventIR extends IRM("Event") {
  eventName?: string;
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;

  readonly propertyName: string;
  readonly tsType: string;
  readonly detailTsType?: string;

  constructor(propertyDeclaration: PropertyDeclaration) {
    super();

    const decorator = singleDecorator(propertyDeclaration, "Event");
    const [eventOptions = {}] =
      decoratorArgs<readonly [EventOptions]>(decorator) ??
      throwError(`@Event decorator requires an options object`);

    this.eventName = eventOptions.eventName;
    this.bubbles = eventOptions.bubbles;
    this.cancelable = eventOptions.cancelable;
    this.composed = eventOptions.composed;

    this.propertyName = propertyDeclaration.name?.getText() ?? "unknown";
    this.tsType = propertyDeclaration.type?.getText() ?? "any";
    this.detailTsType = this.extractEventDetailType(propertyDeclaration);
  }

  /**
   * From EventEmitter<T>, extract type T, returns `undefined` if not EventEmitter<T> or missing.
   */
  private extractEventDetailType(
    propertyDeclaration: PropertyDeclaration,
  ): string | undefined {
    const typeNode = propertyDeclaration.type;
    if (!typeNode) return;

    const typeText = typeNode.getText();
    const match = typeText.match(/EventEmitter\s*<\s*(.+?)\s*>$/);
    return match?.[1];
  }

  static isPencelEventMember(
    member: ClassElement,
  ): member is PropertyDeclaration {
    if (isPropertyDeclaration(member)) {
      try {
        singleDecorator(member, "Event");
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }
}
