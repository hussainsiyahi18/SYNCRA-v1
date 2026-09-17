import {
  SCHEDULE_ACTIVITIES,
  TOPOLOGY_VALIDATION,
  getCriticalPath,
  getActiveCriticalPath,
  validateScheduleTopology
} from "../src/data/alphaFacilityData.js";

console.log("=== SYNCRA CPM TOPOLOGY & SCHEDULE VERIFICATION ===");

// 1. Assert 100% Bidirectional Reciprocity
const topologyResult = validateScheduleTopology(SCHEDULE_ACTIVITIES);
console.log("Topology Validation:", topologyResult);
if (!topologyResult.valid || topologyResult.errorCount > 0) {
  throw new Error(`Topology validation failed with ${topologyResult.errorCount} errors`);
}

// 2. Assert Critical Path Chains
const baselineCP = getCriticalPath();
const expectedBaselineCP = ["CF-101", "CF-104", "CF-108", "CS-201", "TC-401", "M-03"];
console.log("Calculated Baseline Critical Path:", baselineCP);
if (JSON.stringify(baselineCP) !== JSON.stringify(expectedBaselineCP)) {
  throw new Error(`Baseline CP mismatch! Got ${JSON.stringify(baselineCP)}, expected ${JSON.stringify(expectedBaselineCP)}`);
}

const activeCP = getActiveCriticalPath(14);
const expectedActiveCP = ["CF-104", "CF-108", "CS-201", "TC-401", "M-03"];
console.log("Calculated Active Critical Path (Day 14):", activeCP);
if (JSON.stringify(activeCP) !== JSON.stringify(expectedActiveCP)) {
  throw new Error(`Active CP mismatch! Got ${JSON.stringify(activeCP)}, expected ${JSON.stringify(expectedActiveCP)}`);
}

// 3. Assert Non-Critical Activity Float > 0
const nonCriticalActivities = SCHEDULE_ACTIVITIES.filter(a => a.type === "activity" && !a.isCritical);
console.log(`Found ${nonCriticalActivities.length} non-critical activities.`);
for (const act of nonCriticalActivities) {
  console.log(`- Activity ${act.id} (${act.name}): TF = ${act.totalFloat}, FF = ${act.freeFloat}`);
  if (act.totalFloat <= 0) {
    throw new Error(`Activity ${act.id} is non-critical but has TF = ${act.totalFloat} (expected > 0)`);
  }
}

// 4. Assert Decoupled Non-Terminal Milestone Semantics
const m01 = SCHEDULE_ACTIVITIES.find(a => a.id === "M-01");
console.log(`- Side Milestone M-01: TF = ${m01.totalFloat}, isCritical = ${m01.isCritical}, LF = ${m01.lateFinish}`);
if (m01.totalFloat !== 9 || m01.isCritical !== false) {
  throw new Error(`M-01 side milestone float invalid! TF = ${m01.totalFloat}, isCritical = ${m01.isCritical}`);
}

// 5. Assert Terminal Milestone Semantics
const m03 = SCHEDULE_ACTIVITIES.find(a => a.id === "M-03");
console.log(`- Terminal Milestone M-03: TF = ${m03.totalFloat}, isCritical = ${m03.isCritical}, LF = ${m03.lateFinish}`);
if (m03.totalFloat !== 0 || m03.isCritical !== true || m03.lateFinish !== 30) {
  throw new Error(`M-03 terminal milestone constraint invalid!`);
}

// 6. Assert CF-108 Driving Chain Integrity
const cf108 = SCHEDULE_ACTIVITIES.find(a => a.id === "CF-108");
console.log(`- Driving Critical Activity CF-108: TF = ${cf108.totalFloat}, isCritical = ${cf108.isCritical}, ES = ${cf108.earlyStart}, EF = ${cf108.earlyFinish}, LS = ${cf108.lateStart}, LF = ${cf108.lateFinish}`);
if (cf108.totalFloat !== 0 || cf108.isCritical !== true || cf108.lateFinish !== 21) {
  throw new Error(`CF-108 driving parameters invalid! LF = ${cf108.lateFinish}, TF = ${cf108.totalFloat}`);
}

console.log("\n>>> ALL PHASE 1 CPM ACCEPTANCE CRITERIA VERIFIED 100% PROGRAMMATICALLY! <<<");
