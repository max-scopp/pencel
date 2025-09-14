import { isBrowser } from "./isBrowser.ts";

export const throwConsumerError = (
  message: string,
  collapsedDetails?: any,
): never => {
  const timestamp = new Date().toISOString();

  const badgeCss =
    "background: #d32f2f; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;";

  console.error(
    `%c⛔ PENCIL USAGE ERROR %c ${timestamp} %c${message} \n%cThis can likely be fixed by checking the component's render function.`,
    badgeCss,
    "color: grey; font-size: 10px;",
    "all: initial;",
    "color: #f1cbcb81; font-style: italic;",
  );

  if (isBrowser) {
    console.groupCollapsed(`Show Details`);
    console.dir(collapsedDetails ?? {});
    console.groupEnd();

    // Still throw the actual error so dev tools / stack traces work
    throw new Error(
      `Pencil usage error: ${message}\n\nThis can likely be fixed by checking the component's props and their usage.`,
    );
  }
};
