import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const runNumber = process.argv[2] || "1";
const timestamp = new Date().toISOString();

console.log(`\n====================================================================`);
console.log(`  CAREORBIT 360: FULL 37-TEST SUITE EXECUTION — RUN #${runNumber}`);
console.log(`  Timestamp: ${timestamp}`);
console.log(`====================================================================\n`);

const reportsDir = path.resolve(process.cwd(), "tests/reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

let output = `CareOrbit 360 Full 37-Test Suite Run #${runNumber}\nTimestamp: ${timestamp}\n\n`;
let passedCount = 0;
let failedCount = 0;

try {
  console.log("--- PART 1: 13-TEST BASELINE API & SECURITY SUITE ---");
  const out1 = execSync("npx tsx tests/api.test.ts", { encoding: "utf8" });
  console.log(out1);
  output += out1 + "\n";
  passedCount += 13;
} catch (err: any) {
  console.error("Part 1 failed:", err.stdout || err.message);
  output += (err.stdout || err.message) + "\n";
  failedCount += 13;
}

try {
  console.log("--- PART 2: 24-TEST THREE-ROUNDS COMPREHENSIVE SUITE ---");
  const out2 = execSync("npx tsx tests/three-rounds.test.ts", { encoding: "utf8" });
  console.log(out2);
  output += out2 + "\n";
  passedCount += 24;
} catch (err: any) {
  console.error("Part 2 failed:", err.stdout || err.message);
  output += (err.stdout || err.message) + "\n";
  failedCount += 24;
}

const summary = {
  run: Number(runNumber),
  timestamp,
  totalTests: 37,
  passed: passedCount,
  failed: failedCount,
  successRate: `${((passedCount / 37) * 100).toFixed(1)}%`,
  status: failedCount === 0 ? "PASSED" : "FAILED",
};

const jsonPath = path.join(reportsDir, `test-run-${runNumber}.json`);
const txtPath = path.join(reportsDir, `test-run-${runNumber}.txt`);

fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
fs.writeFileSync(txtPath, output);

console.log(`\nRun #${runNumber} Complete: ${passedCount}/37 Passed (${summary.status})`);
console.log(`Saved report to: ${jsonPath} and ${txtPath}\n`);

if (failedCount > 0) {
  process.exit(1);
}
