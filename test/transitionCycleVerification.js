/**
 * End-to-End Project Transition & State Cycle Verification
 * 
 * Verifies the full user cycle:
 * Alpha opens → Rajasthan opens → switch back to Alpha → Alpha simulation works → no stale state leaks.
 */

import {
  getProjectById,
  getProjectScheduleState
} from "../src/data/projectsRegistry.js";
import { simulateSchedulePerturbation } from "../src/data/scheduleSimulation.js";
import { getScenarioById } from "../src/data/demoScenarios.js";

console.log("===============================================================================");
console.log("       SYNCRA TRANSITION CYCLE VERIFICATION (ALPHA -> RAJ -> ALPHA)           ");
console.log("===============================================================================\n");

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

// 1. Alpha opens initially
console.log("1. ALPHA FACILITY INITIAL OPEN:");
const alpha1 = getProjectById("alpha-facility");
assert(alpha1 !== null, "Alpha Facility found via getProjectById");
assert(alpha1.id === "alpha-facility-assam", "Alpha ID matches canonical alpha-facility-assam");
assert(alpha1.activities.length === 14, "Alpha has 14 WBS nodes");
assert(alpha1.capabilities.hasSimulationSandbox === true, "Alpha has simulation sandbox capability");

// Alpha default schedule state
const alphaState1 = getProjectScheduleState(alpha1, null, simulateSchedulePerturbation, getScenarioById);
assert(alphaState1.targetNode.id === "CF-104", "Target node is CF-104 (default scenario)");
assert(alphaState1.projectDelayDays === 3, "Finish variance is +3d (Day 30 -> Day 33)");
assert(alphaState1.milestoneExposure["M-03"].perturbedEF === 33, "Substantial completion finish is Day 33");
console.log("  Initial Alpha state verified.\n");

// 2. Rajasthan opens
console.log("2. SWITCH TO RAJASTHAN:");
const raj = getProjectById("thar-solar-rajasthan");
assert(raj !== null, "Rajasthan found via getProjectById");
assert(raj.activities.length === 8, "Rajasthan has 8 independent solar EPC activities");
assert(raj.capabilities.hasSimulationSandbox === false, "Rajasthan has no simulation sandbox");
assert(raj.baselineFinishDay === 90, "Rajasthan baseline COD is Day 90");
assert(raj.statusDate === "Day 42 · Shift A", "Rajasthan status date is Day 42");

// Rajasthan schedule state with reset scenario
const rajState = getProjectScheduleState(raj, null, simulateSchedulePerturbation, getScenarioById);
assert(rajState.disturbance.activityId === null, "Rajasthan has no disturbance");
assert(rajState.projectDelayDays === 0, "Rajasthan delay days is 0 (no Assam +3d leakage)");
assert(rajState.targetNode.id === "SP-204", "Rajasthan target node is SP-204");
assert(rajState.milestoneExposure["M-04"].perturbedEF === 90, "Rajasthan COD finish is Day 90");
assert(rajState.milestoneExposure["M-03"] === undefined, "Rajasthan has no M-03 milestone");

// Check that no Assam activity exists in Rajasthan activities
const rajIds = raj.activities.map(a => a.id);
const assamIds = ["CF-101", "CF-104", "CF-105", "CF-108", "MP-301", "CS-201", "TC-401", "M-01", "M-03"];
for (const aId of assamIds) {
  assert(!rajIds.includes(aId), `Rajasthan activities array must NOT contain Assam activity ${aId}`);
}
console.log("  Rajasthan state verified with zero Assam leakage.\n");

// 3. Switch back to Alpha
console.log("3. SWITCH BACK TO ALPHA:");
const alpha2 = getProjectById("alpha-facility");
assert(alpha2 !== null, "Alpha found again via getProjectById");

// When returning to Alpha, default scenario 'cf104-blockage' is restored
const alphaState2 = getProjectScheduleState(alpha2, alpha2.defaultScenarioId, simulateSchedulePerturbation, getScenarioById);
assert(alphaState2.targetNode.id === "CF-104", "Alpha restored target node is CF-104");
assert(alphaState2.projectDelayDays === 3, "Alpha restored project delay is +3 days");
assert(alphaState2.milestoneExposure["M-03"].perturbedEF === 33, "Alpha terminal finish is Day 33");
assert(alphaState2.milestoneExposure["M-04"] === undefined, "Alpha has no Rajasthan M-04 milestone");
assert(alphaState2.perturbedActivities.length === 14, "Alpha restored activities array has 14 nodes");

// Check that no Rajasthan activity exists in Alpha activities
const alphaIds = alpha2.activities.map(a => a.id);
const rajOnlyIds = ["SP-101", "SP-201", "SP-204", "SP-208", "EE-302", "M-02", "TC-501", "M-04"];
for (const rId of rajOnlyIds) {
  assert(!alphaIds.includes(rId), `Alpha activities array must NOT contain Rajasthan activity ${rId}`);
}

// 4. Verify Phase 2 Simulation Sandbox Scenarios in Alpha after return
console.log("\n4. VERIFY ALPHA SIMULATION SANDBOX FUNCTIONALITY POST-SWITCH:");
// Scenario 2: MP-301 delay
const mp301State = getProjectScheduleState(alpha2, "mp301-delay", simulateSchedulePerturbation, getScenarioById);
assert(mp301State.targetNode.id === "MP-301", "Simulation Scenario 2 (MP-301) functions correctly");
assert(mp301State.projectDelayDays === 0, "MP-301 delay is absorbed into float");
assert(mp301State.milestoneExposure["M-03"].perturbedEF === 30, "M-03 remains Day 30");

// Scenario 1: CF-104 blockage
const cf104State = getProjectScheduleState(alpha2, "cf104-blockage", simulateSchedulePerturbation, getScenarioById);
assert(cf104State.targetNode.id === "CF-104", "Simulation Scenario 1 (CF-104) functions correctly");
assert(cf104State.projectDelayDays === 3, "CF-104 slips project finish by +3d");
assert(cf104State.milestoneExposure["M-03"].perturbedEF === 33, "M-03 moves to Day 33");

console.log("\n===============================================================================");
console.log(" ✅ COMPLETE CYCLE (ALPHA -> RAJASTHAN -> ALPHA) FULLY VERIFIED! ");
console.log("===============================================================================\n");
