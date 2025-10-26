import type { EventOptions } from "@pencel/runtime";
import { throwError } from "@pencel/utils";
import {
  type ClassElement,
  isMethodDeclaration,
  type MethodDeclaration,
} from "typescript";
import { decoratorArgs } from "../../ts-utils/decoratorArgs.ts";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import { IRM } from "./ref.ts";

export class EventIR extends IRM("Event") implements EventOptions {
  eventName?: string;
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;

  constructor(methodDeclaration: MethodDeclaration) {
    super();

    const decorator = singleDecorator(methodDeclaration, "Event");
    const [eventOptions] =
      decoratorArgs<readonly [EventOptions]>(decorator) ??
      throwError(`@Event decorator requires an options object`);

    this.eventName = eventOptions.eventName;
    this.bubbles = eventOptions.bubbles;
    this.cancelable = eventOptions.cancelable;
    this.composed = eventOptions.composed;
  }

  static isPencelEventMember(
    member: ClassElement,
  ): member is MethodDeclaration {
    if (isMethodDeclaration(member)) {
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
