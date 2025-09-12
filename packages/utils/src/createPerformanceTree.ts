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
  const endTime = perfNode.endTime || performance.now();
  const totalTime = Math.max(0, (endTime - perfNode.startTime) * 1000); // Total time including children

  // Calculate exclusive time (time spent only in this operation, excluding children)
  let exclusiveTime = totalTime;
  for (const child of perfNode.children) {
    const childEndTime = child.endTime || performance.now();
    const childStartTime = child.startTime;
    if (childEndTime > childStartTime) {
      exclusiveTime -= (childEndTime - childStartTime) * 1000;
    }
  }
  exclusiveTime = Math.max(0, exclusiveTime);

  return {
    name: perfNode.name,
    time: exclusiveTime, // Use exclusive time for better breakdown
    children: perfNode.children.map(convertToTreeNode),
  };
}
function logPerformanceTree(root: TreeNode): void {
  const totalTime = root.time;

  function formatTime(us: number): string {
    if (us < 1000) {
      // For sub-millisecond times, show microseconds
      return `${us.toFixed(1)}μs`;
    } else {
      // For millisecond and above, show milliseconds
      return `${(us / 1000).toFixed(3)}ms`;
    }
  }

  function getStyle(us: number, parentTime: number): string {
    // Ignore coloring anything < 0.1ms (100μs)
    if (us < 100) return "";

    const ratio = parentTime > 0 ? us / parentTime : 0;

    // Gradient from red (slowest) to green (fastest)
    // red → orange → yellow → blue → green
    let color: string;
    if (ratio >= 0.8) {
      color = "#ff0000"; // red
    } else if (ratio >= 0.6) {
      color = "#ff8000"; // orange
    } else if (ratio >= 0.4) {
      color = "#ffff00"; // yellow
    } else if (ratio >= 0.2) {
      color = "#0080ff"; // blue
    } else {
      color = "#00ff00"; // green
    }

    return `color: ${color}; font-weight: bold;`;
  }

  function logNode(
    node: TreeNode,
    depth: number,
    parentTime: number,
    isLast: boolean = false,
    prefix: string = "",
  ): void {
    const percentage =
      parentTime > 0 ? ((node.time / parentTime) * 100).toFixed(2) : "100.00";
    const message = `${node.name}: ${formatTime(node.time)} (${percentage}%)`;
    const style = getStyle(node.time, parentTime);

    // Create tree structure with ASCII characters
    let treePrefix = prefix;
    if (depth > 0) {
      treePrefix += isLast ? "└── " : "├── ";
    }

    const fullMessage = `${treePrefix}${message}`;

    if (isBrowser && node.children.length > 0 && depth === 0) {
      console.groupCollapsed(fullMessage);
      node.children.forEach((child, index) => {
        const childIsLast = index === node.children.length - 1;
        const childPrefix = prefix + (isLast ? "    " : "│   ");
        logNode(child, depth + 1, node.time, childIsLast, childPrefix);
      });
      console.groupEnd();
    } else if (isBrowser && node.children.length > 0) {
      log(fullMessage);
      node.children.forEach((child, index) => {
        const childIsLast = index === node.children.length - 1;
        const childPrefix = prefix + (isLast ? "    " : "│   ");
        logNode(child, depth + 1, node.time, childIsLast, childPrefix);
      });
    } else {
      log(fullMessage, style);
      node.children.forEach((child, index) => {
        const childIsLast = index === node.children.length - 1;
        const childPrefix = prefix + (isLast ? "    " : "│   ");
        logNode(child, depth + 1, node.time, childIsLast, childPrefix);
      });
    }
  }

  const overallMessage = `Overall Time: ${formatTime(totalTime)}`;
  log(overallMessage, "font-weight: bold;");

  root.children.forEach((child, index) => {
    const isLast = index === root.children.length - 1;
    logNode(child, 0, totalTime, isLast, "");
  });
}
