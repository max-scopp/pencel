/** biome-ignore-all lint/suspicious/noConsole: its logging */
import { ansiStackTrace, ansiTimestamp, ERROR_LABEL, getAnsiFromStyle, PENCIL_ERROR } from "./ansi.ts";
import { coordLog } from "./coordinated-logging.ts";
import { ansiLog } from "./getAnsiFromStyle.ts";
import { isBrowser } from "./isBrowser.ts";

// This can be overridden via tsdown's `define` option for tree-shaking
const PENCEL_LOG_ENABLED = true;

export function log(message: string, style?: string, ...other: unknown[]): void {
  if (!PENCEL_LOG_ENABLED) {
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
    const logMessage = `${ansiLog()} ${ansiTimestamp(timestamp)} ${ansiCode}${message}${getAnsiFromStyle("reset")}`;

    // Use coordinated logging to avoid interfering with progress bars
    if (other.length > 0) {
      coordLog(`${logMessage} ${other.join(" ")}`);
    } else {
      coordLog(logMessage);
    }
  }
}

export function createLog(namespace: string): (message: string, style?: string, ...other: unknown[]) => void {
  return (message: string, style?: string, ...other: unknown[]) => {
    const prefixedMessage = `[${namespace}] ${message}`;
    log(prefixedMessage, style, ...other);
  };
}

export function debug(message: string, style?: string, ...other: unknown[]): void {
  if (!PENCEL_LOG_ENABLED) {
    return;
  }
  log(message, style, ...other);
}

export function createDebugLog(namespace: string): (message: string, style?: string, ...other: unknown[]) => void {
  return (message: string, style?: string, ...other: unknown[]) => {
    if (!PENCEL_LOG_ENABLED) {
      return;
    }
    const prefixedMessage = `[${namespace}] ${message}`;
    log(prefixedMessage, style, ...other);
  };
}

export function error(err: unknown): void;
export function error(err: Error): void;
export function error(message: string, style?: string, ...other: unknown[]): void;
export function error(messageOrError: string | Error | unknown, style?: string, ...other: unknown[]): void {
  if (!PENCEL_LOG_ENABLED) {
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
): ((err: Error) => void) & ((message: string, style?: string, ...other: unknown[]) => void) {
  const prefixedError = (err: Error): void => {
    const prefixedMessage = `[${namespace}] ${err.message}`;
    const newError = new Error(prefixedMessage);
    newError.stack = err.stack;
    error(newError);
  };

  const prefixedLog = (message: string, style?: string, ...other: unknown[]): void => {
    const prefixedMessage = `[${namespace}] ${message}`;
    error(prefixedMessage, style, ...other);
  };

  // Create a function that can handle both overloads
  function combined(messageOrError: string | Error, style?: string, ...other: unknown[]): void {
    if (messageOrError instanceof Error) {
      prefixedError(messageOrError);
    } else {
      prefixedLog(messageOrError, style, ...other);
    }
  }

  return combined;
}

export function createWarn(namespace: string): (message: string, style?: string, ...other: unknown[]) => void {
  return (message: string, style?: string, ...other: unknown[]) => {
    const prefixedMessage = `[${namespace}] ${message}`;
    warn(prefixedMessage, style, ...other);
  };
}

export function warn(message: string, style?: string, ...other: unknown[]): void {
  if (!PENCEL_LOG_ENABLED) {
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
    console.group(
      `%c⚠️ pencil%c ${timestamp} %cWARNING: ${message}`,
      "background: #fbc02d; color: black; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;",
      "color: grey; font-weight: normal;",
      "color: #fbc02d; font-weight: bold;",
    );
    if (style || other.length > 0) {
      console.warn(message, style || "", ...other);
    }
    console.groupEnd();
  } else {
    const ansiCode = style ? getAnsiFromStyle(style) : "\x1b[33m";
    console.warn(
      `${ansiLog()} ${ansiTimestamp(timestamp)} \x1b[33m[WARN]\x1b[0m ${ansiCode}${message}${getAnsiFromStyle("reset")}`,
      ...other,
    );
  }
}
