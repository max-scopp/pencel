import {
  createPerformanceTree,
  type PerformanceTreeController,
} from "@pencel/utils";

export const compilerTree: PerformanceTreeController =
  createPerformanceTree("Compiler");
