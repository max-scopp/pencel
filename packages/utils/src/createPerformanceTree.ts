import { ANSI_RESET, getAnsiFromStyle } from "./getAnsiFromStyle.ts";
import { isBrowser } from "./isBrowser.ts";
import { createLog } from "./log.ts";

export interface TreeNode {
  name: string;
  time: number; // in microseconds
  children: TreeNode[];
  startTime?: number;
  endTime?: number;
}

export interface PerformanceNode {
  name: string;
  startTime: number;
  endTime?: number;
  children: PerformanceNode[];
  parent?: PerformanceNode;
}

export interface PerformanceTreeController {
  start(name: string): void;
  end(name: string): void;
  log(): void;
}

export function createPerformanceTree(
  namespace = "Perf",
): PerformanceTreeController {
  // Create namespaced logger for performance metrics
  const logger = createLog(namespace);

  const root: PerformanceNode = {
    name: "root",
    startTime: performance.now(),
    children: [],
  };

  let currentNode = root;
  const activeNodes = new Map<string, PerformanceNode>();

  return {
    start(name: string): void {
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

    end(name: string): void {
      const node = activeNodes.get(name);
      if (node) {
        node.endTime = performance.now();
        activeNodes.delete(name);
        if (node.parent) {
          currentNode = node.parent;
        }
      }
    },

    log(): void {
      root.endTime = performance.now();
      const tree: TreeNode = convertToTreeNode(root);
      logPerformanceTree(tree, logger);
    },
  };
}
function convertToTreeNode(perfNode: PerformanceNode): TreeNode {
  const endTime = perfNode.endTime || performance.now();
  const startTime = perfNode.startTime;

  // Calculate total time in microseconds (1ms = 1000μs)
  const totalTimeUs = Math.max(0, (endTime - startTime) * 1000); // Convert ms to μs

  // Convert children recursively first so we can calculate their total time
  const convertedChildren = perfNode.children.map((child) =>
    convertToTreeNode(child),
  );

  // Calculate total time spent in children
  const childrenTimeUs = convertedChildren.reduce(
    (sum, child) => sum + child.time,
    0,
  );

  return {
    name: perfNode.name,
    time: Math.max(0, totalTimeUs - childrenTimeUs), // Exclusive time
    children: convertedChildren,
    startTime: perfNode.startTime,
    endTime: perfNode.endTime,
  };
}
function logPerformanceTree(
  root: TreeNode,
  logger: ReturnType<typeof createLog>,
): void {
  // Calculate actual total time from root node timing
  const rootEndTime = root.endTime || performance.now();
  const rootStartTime = root.startTime || performance.now();
  const totalTime = Math.max(0, (rootEndTime - rootStartTime) * 1000);

  function formatTime(us: number): string {
    if (us < 1000) {
      // For sub-millisecond times, show microseconds
      return `${us.toFixed(0)}μs`;
    }
    // For millisecond and above, show milliseconds
    return `${(us / 1000).toFixed(3)}ms`;
  }

  function getStyle(us: number, parentTime: number): string {
    // Only skip coloring if the time is exactly 0
    if (us === 0) return "";

    const ratio = parentTime > 0 ? us / parentTime : 0;

    // Create a smooth gradient using HSL color space
    // Map ratio (0-1) to hue (0-120 degrees)
    // 1 = red (0°), 0.5 = yellow (60°), 0 = green (120°)
    const hue = Math.max(0, Math.min(120, (1 - ratio) * 120));

    // Use higher saturation for more vibrant colors and balanced lightness
    const saturation = 65; // 65% saturation for more vivid colors
    const lightness = 45; // 45% lightness for better contrast

    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    return `color: ${color}; font-weight: bold;`;
  }

  function getPercentageColor(percentage: number): string {
    // Green for low percentages (efficient), red for high percentages (inefficient)
    if (percentage <= 10) return "green";
    if (percentage <= 30) return "yellow";
    if (percentage <= 60) return "orange";
    return "red";
  }

  // Helper function to calculate total time including children
  function calculateTotalTime(node: TreeNode): number {
    const childrenTime = node.children.reduce(
      (sum, child) => sum + calculateTotalTime(child),
      0,
    );
    return node.time + childrenTime;
  }

  function logNode(
    node: TreeNode,
    depth: number,
    parentTime: number,
    isLast = false,
    prefix = "",
  ): void {
    // Calculate total time including all nested children
    const nodeTotal = calculateTotalTime(node);

    // Calculate percentage based on parent's total time
    const isGroupHeader = isBrowser && node.children.length > 0 && depth === 0;

    const percentage = Math.min(
      100,
      parentTime > 0 ? (nodeTotal / parentTime) * 100 : 100,
    ).toFixed(2);

    // Format percentage with ANSI colors for CLI use
    const percentageNum = Number.parseFloat(percentage);
    const percentageColor = getPercentageColor(percentageNum);
    const ansiColor = getAnsiFromStyle(percentageColor);
    const coloredPercentage =
      !isBrowser && ansiColor
        ? `${ansiColor}(${percentage}%)${ANSI_RESET}`
        : `(${percentage}%)`;

    const message = `${node.name}: ${formatTime(nodeTotal)}${isGroupHeader ? "" : ` ${coloredPercentage}`}`;
    const style = getStyle(nodeTotal, parentTime);

    // Create tree structure with ASCII characters
    let treePrefix = prefix;
    if (depth > 0) {
      treePrefix += isLast ? "└── " : "├── ";
    }

    const fullMessage = `${treePrefix}${message}`;

    if (isBrowser && node.children.length > 0 && depth === 0) {
      // console.groupCollapsed(fullMessage);
      logger(fullMessage);
      const childrenTotal = node.children.reduce(
        (sum, child) => sum + calculateTotalTime(child),
        0,
      );
      node.children.forEach((child, index) => {
        const childIsLast = index === node.children.length - 1;
        const childPrefix = prefix + (isLast ? "    " : "│   ");
        logNode(child, depth + 1, childrenTotal, childIsLast, childPrefix);
      });
      // console.groupEnd();
    } else if (isBrowser && node.children.length > 0) {
      logger(fullMessage);
      const childrenTotal = node.children.reduce(
        (sum, child) => sum + calculateTotalTime(child),
        0,
      );
      node.children.forEach((child, index) => {
        const childIsLast = index === node.children.length - 1;
        const childPrefix = prefix + (isLast ? "    " : "│   ");
        logNode(child, depth + 1, childrenTotal, childIsLast, childPrefix);
      });
    } else {
      logger(fullMessage, style);
      const childrenTotal = node.children.reduce(
        (sum, child) => sum + calculateTotalTime(child),
        0,
      );
      node.children.forEach((child, index) => {
        const childIsLast = index === node.children.length - 1;
        const childPrefix = prefix + (isLast ? "    " : "│   ");
        logNode(child, depth + 1, childrenTotal, childIsLast, childPrefix);
      });
    }
  }

  root.children.forEach((child, index) => {
    const isLast = index === root.children.length - 1;
    logNode(child, 0, totalTime, isLast, "");
  });
}
