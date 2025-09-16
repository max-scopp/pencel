import { throwError } from "@pencel/utils";

export const throwNoContext = (): never =>
  throwError("Missing component context");
