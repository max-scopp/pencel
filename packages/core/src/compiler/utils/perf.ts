import {
  createPerformanceTree,
  type PerformanceTreeController,
} from "@pencel/utils";

export const perf: PerformanceTreeController =
  createPerformanceTree("Compiler");
