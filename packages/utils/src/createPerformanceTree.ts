import { getAnsiFromStyle } from "./getAnsiFromStyle.ts";
import { isBrowser } from "./isBrowser.ts";
import { createLog } from "./log.ts";

// This can be overridden via tsdown's `define` option for tree-shaking
const PENCEL_PERF_LOG_ENABLED = true;

export interface PerformanceMark {
  name: string;
  startTime: number;
  endTime?: number;
  children: PerformanceMark[];
}

export interface PerformanceTreeController {
  start(name: string): void;
  end(name: string): void;
  log(): void;
}

export function createPerformanceTree(namespace = "Perf"): PerformanceTreeController {
  if (!PENCEL_PERF_LOG_ENABLED) {
    return {
      start: () => {},
      end: () => {},
      log: () => {},
    };
  }

  // Create namespaced logger for performance metrics
  const logger = createLog(namespace);

  let root: PerformanceMark = {
    name: "root",
    startTime: performance.now(),
    children: [],
  };

  let currentNode = root;
  const nodeStack: PerformanceMark[] = [root];

  return {
    start(name: string): void {
      const node: PerformanceMark = {
        name,
        startTime: performance.now(),
        children: [],
      };

      currentNode.children.push(node);
      nodeStack.push(node);
      currentNode = node;
    },

    end(name: string): void {
      const node = nodeStack[nodeStack.length - 1];
      if (node && node.name === name) {
        node.endTime = performance.now();
        nodeStack.pop();
        currentNode = nodeStack[nodeStack.length - 1] || root;
      }
    },

    log(): void {
      root.endTime = performance.now();
      logPerformanceTree(root, logger);

      // Reset for next cycle
      root = {
        name: "root",
        startTime: performance.now(),
        children: [],
      };
      currentNode = root;
      nodeStack.length = 1;
      nodeStack[0] = root;
    },
  };
}

function formatTime(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(0)}μs`;
  }
  return `${ms.toFixed(3)}ms`;
}

function calculateDuration(mark: PerformanceMark): number {
  if (!mark.endTime) return 0;
  return mark.endTime - mark.startTime;
}

function logPerformanceTree(root: PerformanceMark, logger: ReturnType<typeof createLog>): void {
  function logNode(node: PerformanceMark, depth: number, siblingDurations: number[], index: number): void {
    const duration = calculateDuration(node);

    // Calculate percentage relative to siblings at same level
    const totalSiblingDuration = siblingDurations.reduce((a, b) => a + b, 0);
    const percentage = totalSiblingDuration > 0 ? ((duration / totalSiblingDuration) * 100).toFixed(2) : "0.00";

    // Format the message
    const indent = "  ".repeat(depth);
    const isLast = index === siblingDurations.length - 1;
    const prefix = depth === 0 ? "" : isLast ? "└── " : "├── ";

    const message = `${indent}${prefix}${node.name}: ${formatTime(duration)} (${percentage}%)`;

    const percentNum = Number.parseFloat(percentage);

    if (isBrowser) {
      // Browser: Use HSL gradient blue → green → orange → red
      // 0% = blue (240°), 50% = green (120°), 100% = red (0°)
      const hue = 240 - (percentNum / 100) * 240; // 240 to 0
      const saturation = 60;
      const lightness = 55;
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      logger(message, `color: ${color}; font-weight: bold;`);
    } else {
      // Node.js: Only highlight the max percentage
      const isMax = percentNum === Math.max(...siblingDurations.map((d) => (d / totalSiblingDuration) * 100));
      if (isMax && percentNum > 0) {
        const ansiColor = getAnsiFromStyle("red");
        if (ansiColor) {
          logger(message, `color: ${ansiColor}`);
        } else {
          logger(message);
        }
      } else {
        logger(message);
      }
    }

    // Log children
    if (node.children.length > 0) {
      const childDurations = node.children.map((c) => calculateDuration(c));
      node.children.forEach((child, childIndex) => {
        logNode(child, depth + 1, childDurations, childIndex);
      });
    }
  }

  // Log root's children (skip root itself)
  if (root.children.length > 0) {
    const childDurations = root.children.map((c) => calculateDuration(c));
    root.children.forEach((child, index) => {
      logNode(child, 0, childDurations, index);
    });
  }
}
