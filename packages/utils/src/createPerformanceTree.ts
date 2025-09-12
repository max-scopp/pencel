import { isBrowser } from "./isBrowser.ts";
import { log } from "./log.ts";

export interface TreeNode {
  name: string;
  time: number; // in microseconds
  children: TreeNode[];
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
function logPerformanceTree(root: TreeNode): void {
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
