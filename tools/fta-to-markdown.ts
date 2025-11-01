#!/usr/bin/env bun
/**
 * Convert FTA JSON output to Markdown report with technical debt insights.
 */

import { readFileSync, writeFileSync } from "fs";

interface Halstead {
  difficulty: number;
  effort: number;
  bugs: number;
  volume: number;
}

interface FTAFile {
  file_name: string;
  line_count: number;
  fta_score: number;
  assessment: string;
  cyclo: number;
  halstead: Halstead;
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

    const avgScore = (
      data.reduce((sum, f) => sum + f.fta_score, 0) / data.length
    ).toFixed(2);

    // Health status header
    markdown += "## Overall Status\n\n";
    if (_thresholdExceeded) {
      markdown += `🚨 **Code Quality Alert**: Average FTA score of **${avgScore}** exceeds the threshold of **70**.\n\n`;
      markdown +=
        "This indicates complexity or maintainability concerns that should be addressed before merging.\n";
    } else {
      markdown += `✅ **Code Quality OK**: Average FTA score of **${avgScore}** is within acceptable limits.\n\n`;
      markdown += "The codebase maintains good maintainability standards.\n";
    }

    // Calculate average Halstead metrics for technical debt insights
    const avgDifficulty =
      data.reduce((sum, f) => sum + (f.halstead?.difficulty || 0), 0) /
      data.length;
    const avgBugs =
      data.reduce((sum, f) => sum + (f.halstead?.bugs || 0), 0) / data.length;
    const avgCyclo =
      data.reduce((sum, f) => sum + (f.cyclo || 0), 0) / data.length;
    const avgVolume =
      data.reduce((sum, f) => sum + (f.halstead?.volume || 0), 0) / data.length;

    markdown += "\n## Technical Debt & Maintainability Insights\n\n";
    markdown += `**Difficulty to Understand**: ${avgDifficulty.toFixed(1)}/100 - `;
    if (avgDifficulty > 50) {
      markdown += "🔴 High complexity, risky to modify\n";
    } else if (avgDifficulty > 30) {
      markdown += "🟡 Moderate, needs careful review\n";
    } else {
      markdown += "🟢 Straightforward and clear\n";
    }

    markdown += `**Predicted Bug Density**: ${avgBugs.toFixed(2)} bugs/1000 LOC - `;
    if (avgBugs > 0.5) {
      markdown += "🔴 High risk, refactor needed\n";
    } else if (avgBugs > 0.2) {
      markdown += "🟡 Moderate risk\n";
    } else {
      markdown += "🟢 Low defect rate\n";
    }

    markdown += `**Code Paths (Cyclomatic)**: ${avgCyclo.toFixed(1)} avg - `;
    if (avgCyclo > 10) {
      markdown += "🔴 Too many branches\n";
    } else if (avgCyclo > 5) {
      markdown += "🟡 Multiple paths, test coverage critical\n";
    } else {
      markdown += "🟢 Manageable\n";
    }

    markdown += `**Code Size (Vocabulary)**: ${avgVolume.toFixed(0)} - `;
    if (avgVolume > 1000) {
      markdown += "🔴 Very large, break it up\n";
    } else if (avgVolume > 500) {
      markdown += "🟡 Moderate size\n";
    } else {
      markdown += "🟢 Well-scoped\n";
    }

    // Final verdict based on assessment distribution
    const assessmentCounts = {
      needs_improvement: data.filter(
        (f) => f.assessment === "Needs improvement",
      ).length,
      could_be_better: data.filter((f) => f.assessment === "Could be better")
        .length,
      ok: data.filter((f) => f.assessment === "OK").length,
    };

    markdown += `\n## Final Verdict\n\n`;
    if (assessmentCounts.needs_improvement > 0) {
      markdown += `🚨 ${assessmentCounts.needs_improvement} file(s) need improvement\n`;
    }
    if (assessmentCounts.could_be_better > 0) {
      markdown += `💡 ${assessmentCounts.could_be_better} file(s) could be better\n`;
    }
    if (assessmentCounts.ok > 0) {
      markdown += `✅ ${assessmentCounts.ok} file(s) well-maintained\n`;
    }

    // Identify problem areas if any
    const problematicFiles = data.filter((f) => f.fta_score > 70);
    if (problematicFiles.length > 0) {
      markdown += `\n### ⚠️ Files Exceeding Threshold\n\n`;
      markdown += `${problematicFiles.length} file(s) have complexity scores above 70:\n\n`;
      problematicFiles.forEach((file) => {
        markdown += `- **${file.file_name}** (${file.fta_score.toFixed(2)}) - ${file.assessment}\n`;
      });
    }

    // Identify well-maintained files
    const wellMaintainedFiles = data.filter((f) => f.fta_score < 30);
    if (wellMaintainedFiles.length > 0) {
      markdown += `\n### ✨ Well-Maintained Files\n\n`;
      markdown += `${wellMaintainedFiles.length} file(s) have excellent maintainability:\n\n`;
      wellMaintainedFiles.forEach((file) => {
        markdown += `- **${file.file_name}** (${file.fta_score.toFixed(2)}) - ${file.assessment}\n`;
      });
    }

    markdown += "\n<details>\n";
    markdown += "<summary><b>📋 Detailed File Analysis</b></summary>\n\n";
    markdown += "| File | Lines | FTA Score | Assessment |\n";
    markdown += "|------|-------|-----------|------------|\n";

    data.forEach((file) => {
      const score = file.fta_score.toFixed(2);
      markdown += `| ${file.file_name} | ${file.line_count} | ${score} | ${file.assessment} |\n`;
    });

    markdown += "\n</details>\n";

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
