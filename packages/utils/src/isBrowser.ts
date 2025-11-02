import process from "node:process";
export const isBrowser: boolean = typeof process === "undefined";
