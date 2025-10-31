import type { EventOptions } from "@pencel/runtime";
import { throwError } from "@pencel/utils";
import {
  type ClassElement,
  isMethodDeclaration,
  type MethodDeclaration,
} from "typescript";
import { decoratorArgs } from "../../ts-utils/decoratorArgs.ts";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import { IRM } from "./irri.ts";

/**
 * EventIR is the flat IR representation of an @Event-decorated method.
 * Contains both user-provided options and compiler-resolved metadata as public readonly fields.
 *
 * EventIR = { eventName, bubbles, cancelable, composed, methodName }
 *
 * The IR is the single source of truth. Transformers extract a subset as [INTERNALS].
 */
export class EventIR extends IRM("Event") {
  // User-provided fields from @Event decorator
  eventName?: string;
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;

  // Compiler-resolved metadata (flat, alongside user fields)
  readonly methodName: string;

  constructor(methodDeclaration: MethodDeclaration) {
    super();

    const decorator = singleDecorator(methodDeclaration, "Event");
    const [eventOptions] =
      decoratorArgs<readonly [EventOptions]>(decorator) ??
      throwError(`@Event decorator requires an options object`);

    // Store user-provided options
    this.eventName = eventOptions.eventName;
    this.bubbles = eventOptions.bubbles;
    this.cancelable = eventOptions.cancelable;
    this.composed = eventOptions.composed;

    // Store compiler-resolved metadata directly as public fields
    this.methodName = methodDeclaration.name?.getText() ?? "unknown";
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
