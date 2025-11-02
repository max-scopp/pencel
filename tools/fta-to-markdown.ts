#!/usr/bin/env bun

/**
 * Convert FTA JSON output to Markdown report with technical debt insights.
 */

import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

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

function generateReport(inputPath: string, outputPath: string, _thresholdExceeded: boolean = false): void {
  try {
    const data: FTAFile[] = JSON.parse(readFileSync(inputPath, "utf8"));

    if (!Array.isArray(data) || data.length === 0) {
      console.error("Invalid FTA output: expected non-empty array");
      process.exit(1);
    }

    let markdown = "# FTA Code Quality Report\n\n";

    const avgScore = (data.reduce((sum, f) => sum + f.fta_score, 0) / data.length).toFixed(2);

    // Health status header
    if (_thresholdExceeded) {
      markdown += `🚨 **Alert**: Average score **${avgScore}** exceeds threshold (70)\n\n`;
    } else {
      markdown += `✅ **OK**: Average score **${avgScore}** within limits\n\n`;
    }

    // Calculate average Halstead metrics for technical debt insights
    const avgDifficulty = data.reduce((sum, f) => sum + (f.halstead?.difficulty || 0), 0) / data.length;
    const avgBugs = data.reduce((sum, f) => sum + (f.halstead?.bugs || 0), 0) / data.length;
    const avgCyclo = data.reduce((sum, f) => sum + (f.cyclo || 0), 0) / data.length;

    markdown += "\n## Insights\n\n";
    markdown += `**Difficulty**: ${avgDifficulty.toFixed(1)}/100 - `;
    if (avgDifficulty > 50) {
      markdown += "🔴 High, risky to modify\n";
    } else if (avgDifficulty > 30) {
      markdown += "🟡 Moderate, needs review\n";
    } else {
      markdown += "🟢 Straightforward, easy to change\n";
    }

    markdown += `**Bug Density**: ${avgBugs.toFixed(2)} bugs/1000 LOC - `;
    if (avgBugs > 0.5) {
      markdown += "🔴 High risk, refactor needed\n";
    } else if (avgBugs > 0.2) {
      markdown += "🟡 Moderate, monitor changes\n";
    } else {
      markdown += "🟢 Low, well maintained\n";
    }

    markdown += `**Code Paths**: ${avgCyclo.toFixed(1)} avg - `;
    if (avgCyclo > 10) {
      markdown += "🔴 Too many, break functions apart\n";
    } else if (avgCyclo > 5) {
      markdown += "🟡 Multiple paths, increase test coverage\n";
    } else {
      markdown += "🟢 Manageable, good structure\n";
    }

    // Final verdict based on assessment distribution
    const assessmentCounts = {
      needs_improvement: data.filter((f) => f.assessment === "Needs improvement"),
      could_be_better: data.filter((f) => f.assessment === "Could be better"),
      ok: data.filter((f) => f.assessment === "OK"),
    };

    markdown += `\n## Final Verdict\n\n`;
    markdown += `🚨 ${assessmentCounts.needs_improvement.length} need improvement | `;
    markdown += `💡 ${assessmentCounts.could_be_better.length} could be better | `;
    markdown += `✅ ${assessmentCounts.ok.length} well-maintained\n`;

    // Needs improvement - open by default
    if (assessmentCounts.needs_improvement.length > 0) {
      markdown += `\n<details open>\n`;
      markdown += `<summary><b>🚨 Files Needing Improvement</b></summary>\n\n`;
      assessmentCounts.needs_improvement.forEach((file) => {
        markdown += `- **${file.file_name}** (Score: ${file.fta_score.toFixed(2)})\n`;
      });
      markdown += `\n</details>\n`;
    }

    // Could be better - closed by default
    if (assessmentCounts.could_be_better.length > 0) {
      markdown += `\n<details>\n`;
      markdown += `<summary><b>💡 Files That Could Be Better</b></summary>\n\n`;
      assessmentCounts.could_be_better.forEach((file) => {
        markdown += `- **${file.file_name}** (Score: ${file.fta_score.toFixed(2)})\n`;
      });
      markdown += `\n</details>\n`;
    }

    // Well-maintained - top 5 - closed by default
    const topWellMaintained = assessmentCounts.ok.sort((a, b) => a.fta_score - b.fta_score).slice(0, 5);
    if (topWellMaintained.length > 0) {
      markdown += `\n<details>\n`;
      markdown += `<summary><b>✨ Top 5 Well-Maintained Files</b></summary>\n\n`;
      topWellMaintained.forEach((file) => {
        markdown += `- **${file.file_name}** (Score: ${file.fta_score.toFixed(2)})\n`;
      });
      markdown += `\n</details>\n`;
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
