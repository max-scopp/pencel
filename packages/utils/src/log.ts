/** biome-ignore-all lint/suspicious/noConsole: its logging */
import {
  ansiStackTrace,
  ansiTimestamp,
  ERROR_LABEL,
  getAnsiFromStyle,
  PENCIL_ERROR,
} from "./ansi.ts";
import { ansiLog } from "./getAnsiFromStyle.ts";
import { isBrowser } from "./isBrowser.ts";

const PENCIL_DO_LOGGING = (): boolean => {
  return true;
  // return Boolean(
  //   globalThis.PENCIL_DEBUG ||
  //     process.env.DEBUG ||
  //     (isBrowser
  //       ? new URLSearchParams(window.location.search).get("pencilDebug")
  //       : null),
};

export function log(
  message: string,
  style?: string,
  ...other: unknown[]
): void {
  if (!PENCIL_DO_LOGGING()) {
    return;
  }

  const now = new Date();
  const timestamp =
    now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) +
    "." +
    now.getMilliseconds().toString().padStart(3, "0");

  if (isBrowser) {
    console.log(
      `%c✏️ pencil%c ${timestamp} %c${message}`,
      "background: #118e67; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;",
      "color: grey;",
      style || "",
      ...other,
    );
  } else {
    const ansiCode = style ? getAnsiFromStyle(style) : "";
    console.log(
      `${ansiLog()} ${ansiTimestamp(timestamp)} ${ansiCode}${message}${getAnsiFromStyle("reset")}`,
      ...other,
    );
  }
}

export function createLog(
  namespace: string,
): (message: string, style?: string, ...other: unknown[]) => void {
  return (message: string, style?: string, ...other: unknown[]) => {
    const prefixedMessage = `[${namespace}] ${message}`;
    log(prefixedMessage, style, ...other);
  };
}

export function debug(
  message: string,
  style?: string,
  ...other: unknown[]
): void {
  if (!PENCIL_DO_LOGGING()) {
    return;
  }
  log(message, style, ...other);
}

export function createDebugLog(
  namespace: string,
): (message: string, style?: string, ...other: unknown[]) => void {
  return (message: string, style?: string, ...other: unknown[]) => {
    if (!PENCIL_DO_LOGGING()) {
      return;
    }
    const prefixedMessage = `[${namespace}] ${message}`;
    log(prefixedMessage, style, ...other);
  };
}

export function error(err: unknown): void;
export function error(err: Error): void;
export function error(
  message: string,
  style?: string,
  ...other: unknown[]
): void;
export function error(
  messageOrError: string | Error | unknown,
  style?: string,
  ...other: unknown[]
): void {
  if (!PENCIL_DO_LOGGING()) {
    return;
  }

  let message: string;
  let errorObj: Error | null = null;

  if (messageOrError instanceof Error) {
    message = messageOrError.message;
    errorObj = messageOrError;
  } else {
    message = String(messageOrError);
    errorObj = new Error(message);
  }

  const now = new Date();
  const timestamp =
    now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) +
    "." +
    now.getMilliseconds().toString().padStart(3, "0");

  if (isBrowser) {
    console.group(
      `%c⛔ pencil%c ${timestamp} %cERROR: ${message}`,
      "background: #d32f2f; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;",
      "color: grey; font-weight: normal;",
      "color: #d32f2f; font-weight: bold;",
    );

    if (style || other.length > 0) {
      console.error(message, style || "", ...other);
    }

    if (errorObj.stack) {
      console.error(errorObj.stack);
    }

    console.groupEnd();
  } else {
    const ansiCode = style ? getAnsiFromStyle(style) : "";

    console.error(
      `${PENCIL_ERROR} ${ansiTimestamp(timestamp)} ${ERROR_LABEL} ${ansiCode}${message}${getAnsiFromStyle("reset")}`,
      ...other,
    );

    if (errorObj.stack) {
      console.error(ansiStackTrace("Stack trace:"));
      console.error(ansiStackTrace(errorObj.stack));
    }
  }
}

export function createError(
  namespace: string,
): ((err: Error) => void) &
  ((message: string, style?: string, ...other: unknown[]) => void) {
  const prefixedError = (err: Error): void => {
    const prefixedMessage = `[${namespace}] ${err.message}`;
    const newError = new Error(prefixedMessage);
    newError.stack = err.stack;
    error(newError);
  };

  const prefixedLog = (
    message: string,
    style?: string,
    ...other: unknown[]
  ): void => {
    const prefixedMessage = `[${namespace}] ${message}`;
    error(prefixedMessage, style, ...other);
  };

  // Create a function that can handle both overloads
  function combined(
    messageOrError: string | Error,
    style?: string,
    ...other: unknown[]
  ): void {
    if (messageOrError instanceof Error) {
      prefixedError(messageOrError);
    } else {
      prefixedLog(messageOrError, style, ...other);
    }
  }

  return combined;
}
