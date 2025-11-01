#!/usr/bin/env bun
/**
 * Convert FTA JSON output to Markdown report.
 */

import { readFileSync, writeFileSync } from "fs";

interface FTAFile {
  file_name: string;
  line_count: number;
  fta_score: number;
  assessment: string;
}

function generateReport(
  inputPath: string,
  outputPath: string,
  _thresholdExceeded: boolean = false,
): void {
  try {
    const data: FTAFile[] = JSON.parse(readFileSync(inputPath, "utf8"));

    if (!Array.isArray(data) || data.length === 0) {
      console.error("Invalid FTA output: expected non-empty array");
      process.exit(1);
    }

    let markdown = "# FTA Code Quality Report\n\n";

    markdown += "## Summary\n\n";
    markdown += "| File | Lines | FTA Score | Assessment |\n";
    markdown += "|------|-------|-----------|------------|\n";

    data.forEach((file) => {
      const score = file.fta_score.toFixed(2);
      markdown += `| ${file.file_name} | ${file.line_count} | ${score} | ${file.assessment} |\n`;
    });

    markdown += "\n## Statistics\n\n";
    const avgScore = (
      data.reduce((sum, f) => sum + f.fta_score, 0) / data.length
    ).toFixed(2);
    const maxScore = Math.max(...data.map((f) => f.fta_score)).toFixed(2);
    const minScore = Math.min(...data.map((f) => f.fta_score)).toFixed(2);

    markdown += `- **Files Analyzed**: ${data.length}\n`;
    markdown += `- **Average Score**: ${avgScore}\n`;
    markdown += `- **Highest Score**: ${maxScore}\n`;
    markdown += `- **Lowest Score**: ${minScore}\n`;

    markdown += "\n## Status\n\n";
    if (_thresholdExceeded) {
      markdown +=
        "⚠️ **Threshold Exceeded**: Code quality score exceeds the threshold of 70.\n";
    } else {
      markdown += "✅ Code quality score is within threshold.\n";
    }

    writeFileSync(outputPath, markdown);
    console.log(`✅ FTA report generated: ${outputPath}`);
  } catch (error) {
    console.error("Error processing FTA output:", error);
    process.exit(1);
  }
}

const inputFile = process.argv[2] || "output.json";
const outputFile = process.argv[3] || "FTA_REPORT.md";
const thresholdExceeded = process.argv[4] === "true";

generateReport(inputFile, outputFile, thresholdExceeded);
