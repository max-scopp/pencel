export interface TreeNode {
  name: string;
  time: number; // in microseconds
  children: TreeNode[];
}

const isBrowser = typeof process === "undefined";

export function log(message: string, style?: string): void {
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
    console.log(`%c${timestamp} %c${message}`, "color: grey;", style || "");
  } else {
    const ansiGrey = "\x1b[90m"; // ANSI grey
    const ansiReset = "\x1b[0m";
    const ansiCode = style ? getAnsiFromStyle(style) : "";
    console.log(
      `${ansiGrey}${timestamp}${ansiReset} ${ansiCode}${message}\x1b[0m`,
    );
  }
}

function getAnsiFromStyle(style: string): string {
  if (style.includes("red")) return "\x1b[31m";
  if (style.includes("orange")) return "\x1b[38;5;208m";
  if (style.includes("yellow")) return "\x1b[33m";
  if (style.includes("bold")) return "\x1b[1m";
  return "";
}

export function createLog(
  namespace: string,
): (message: string, style?: string) => void {
  return (message: string, style?: string) => {
    const prefixedMessage = `[${namespace}] ${message}`;
    log(prefixedMessage, style);
  };
}

export interface PerformanceNode {
  name: string;
  startTime: number;
  endTime?: number;
  children: PerformanceNode[];
  parent?: PerformanceNode;
}

export function createPerformanceTree() {
  const root: PerformanceNode = {
    name: "root",
    startTime: performance.now(),
    children: [],
  };

  let currentNode = root;
  const activeNodes = new Map<string, PerformanceNode>();

  return {
    start(name: string) {
      const node: PerformanceNode = {
        name,
        startTime: performance.now(),
        children: [],
        parent: currentNode,
      };

      currentNode.children.push(node);
      activeNodes.set(name, node);
      currentNode = node;
    },

    end(name: string) {
      const node = activeNodes.get(name);
      if (node) {
        node.endTime = performance.now();
        activeNodes.delete(name);
        if (node.parent) {
          currentNode = node.parent;
        }
      }
    },

    log() {
      root.endTime = performance.now();
      const tree: TreeNode = convertToTreeNode(root);
      logPerformanceTree(tree);
    },
  };
}

function convertToTreeNode(perfNode: PerformanceNode): TreeNode {
  const time = perfNode.endTime
    ? (perfNode.endTime - perfNode.startTime) * 1000
    : 0; // Convert to microseconds

  return {
    name: perfNode.name,
    time,
    children: perfNode.children.map(convertToTreeNode),
  };
}

export function logPerformanceTree(root: TreeNode): void {
  const totalTime = root.time;

  function formatTime(us: number): string {
    return `${(us / 1000).toFixed(3)}ms`;
  }

  function getStyle(us: number, maxTime: number): string {
    const ratio = us / maxTime;
    if (ratio > 0.8) return "color: red; font-weight: bold;";
    if (ratio > 0.5) return "color: orange; font-weight: bold;";
    if (ratio > 0.2) return "color: yellow; font-weight: bold;";
    return "";
  }

  function logNode(node: TreeNode, depth: number, parentTime: number): void {
    const percentage =
      parentTime > 0 ? ((node.time / parentTime) * 100).toFixed(2) : "100.00";
    const message = `${node.name}: ${formatTime(node.time)} (${percentage}%)`;
    const style = getStyle(node.time, totalTime);

    if (isBrowser && node.children.length > 0 && depth === 0) {
      console.groupCollapsed(message);
      node.children.forEach((child) => {
        logNode(child, depth + 1, node.time);
      });
      console.groupEnd();
    } else if (isBrowser && node.children.length > 0) {
      console.group(message);
      node.children.forEach((child) => {
        logNode(child, depth + 1, node.time);
      });
      console.groupEnd();
    } else {
      const indent = "  ".repeat(depth);
      log(`${indent}${message}`, style);
      node.children.forEach((child) => {
        logNode(child, depth + 1, node.time);
      });
    }
  }

  const overallMessage = `Overall Time: ${formatTime(totalTime)}`;
  log(overallMessage, "font-weight: bold;");

  root.children.forEach((child) => {
    logNode(child, 0, totalTime);
  });
}
