/**
 * SYNCRA Phase 3 — Enterprise Multi-Project & Context Isolation Verification
 *
 * Explicit verification flow:
 * 1. Login / Shell: No project-specific data on generic platform layer.
 * 2. Workspace: Multiple enterprise projects registered with distinct capabilities.
 * 3. Rajasthan Context: Pure solar EPC context, 0 Assam activities (no CF-104/MP-301).
 * 4. Assam Context: Full 14-node schedule + Phase 2 dynamic perturbation engine.
 * 5. Return to Rajasthan: Zero stale Assam/scenario state leakage.
 */

import {
  PROJECTS_REGISTRY,
  getAllProjects,
  getProjectById,
  getProjectScheduleState,
  DEFAULT_PROJECT_ID
} from "../src/data/projectsRegistry.js";
import { simulateSchedulePerturbation } from "../src/data/scheduleSimulation.js";
import { getScenarioById } from "../src/data/demoScenarios.js";

console.log("===============================================================================");
console.log("       SYNCRA PHASE 3: MULTI-PROJECT CONTEXT ISOLATION VERIFICATION          ");
console.log("===============================================================================\n");

let passedAssertions = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedAssertions++;
  console.log(`  ✓ ${message}`);
}

// ----------------------------------------------------------------------------
// STEP 1: Login & Platform Shell Abstraction
// ----------------------------------------------------------------------------
console.log("STEP 1: Verify Facility-Agnostic Application Shell");
assert(DEFAULT_PROJECT_ID === "alpha-facility-assam", "Default bootstrap project ID is defined");
assert(PROJECTS_REGISTRY["alpha-facility-assam"] !== undefined, "Alpha Facility is registered in catalog");
assert(PROJECTS_REGISTRY["thar-solar-rajasthan"] !== undefined, "Thar Solar Complex is registered in catalog");
console.log("  Step 1 Passed.\n");

// ----------------------------------------------------------------------------
// STEP 2: Workspace Directory & Project Catalog
// ----------------------------------------------------------------------------
console.log("STEP 2: Verify Enterprise Workspace Directory");
const allProjects = getAllProjects();
assert(allProjects.length >= 2, `Workspace has multiple projects registered (found ${allProjects.length})`);

const assamPrj = getProjectById("alpha-facility-assam");
const rajasthanPrj = getProjectById("thar-solar-rajasthan");

assert(assamPrj.id === "alpha-facility-assam", "Assam project resolves correctly");
assert(rajasthanPrj.id === "thar-solar-rajasthan", "Rajasthan project resolves correctly");

assert(assamPrj.location === "Assam, India", "Assam location is preserved");
assert(rajasthanPrj.location === "Bikaner, Rajasthan, India", "Rajasthan location is distinct");

assert(assamPrj.capabilities.hasSimulationSandbox === true, "Assam has Phase 2 simulation sandbox capability");
assert(rajasthanPrj.capabilities.hasSimulationSandbox === false, "Rajasthan has NO simulation sandbox (production status strip)");
assert(rajasthanPrj.capabilities.hasFullCpmEngine === false, "Rajasthan is lightweight and isolated from CPM simulation runner");
console.log("  Step 2 Passed.\n");

// ----------------------------------------------------------------------------
// STEP 3: Rajasthan Project Isolation (First Visit)
// ----------------------------------------------------------------------------
console.log("STEP 3: Verify Rajasthan Context Isolation (No Assam/CF-104/MP-301)");
const assamActivityIds = ["CF-101", "CF-104", "CF-105", "CF-108", "MP-301", "CS-201", "TC-401", "M-01", "M-03"];
const rajasthanActivityIds = rajasthanPrj.activities.map(a => a.id);

for (const assamId of assamActivityIds) {
  assert(
    !rajasthanActivityIds.includes(assamId),
    `Rajasthan activities must NOT contain Assam activity ${assamId}`
  );
}

assert(rajasthanPrj.activities.length === 8, `Rajasthan has lightweight 8-node dataset (found ${rajasthanPrj.activities.length})`);
assert(rajasthanActivityIds.includes("SP-204"), "Rajasthan contains solar activity SP-204");
assert(rajasthanActivityIds.includes("M-04"), "Rajasthan contains COD milestone M-04");

const rajScheduleState1 = getProjectScheduleState(rajasthanPrj, null, simulateSchedulePerturbation, getScenarioById);
assert(rajScheduleState1.disturbance.activityId === null, "Rajasthan initial state has NO active disturbance");
assert(rajScheduleState1.isProjectFinishDelayed === false, "Rajasthan initial state has 0 project finish delay");
assert(rajScheduleState1.projectDelayDays === 0, "Rajasthan initial delay days is 0");
assert(rajScheduleState1.milestoneExposure["M-04"] !== undefined, "Rajasthan references M-04 milestone (Day 90)");
assert(rajScheduleState1.milestoneExposure["M-03"] === undefined, "Rajasthan does NOT reference Assam M-03 milestone");
assert(rajScheduleState1.exposedCriticalChain.every(a => a.id.startsWith("SP-") || a.id.startsWith("EE-") || a.id.startsWith("TC-") || a.id.startsWith("M-")), "Rajasthan critical chain is strictly solar EPC");
console.log("  Step 3 Passed.\n");

// ----------------------------------------------------------------------------
// STEP 4: Switch to Assam (14-Node Schedule + Phase 2 Dynamic Simulation)
// ----------------------------------------------------------------------------
console.log("STEP 4: Switch to Assam (14-Node Schedule + Phase 2 Dynamic Simulation)");
assert(assamPrj.activities.length === 14, `Assam has full 14-node schedule network (found ${assamPrj.activities.length})`);
assert(assamPrj.demoScenarios.length === 3, "Assam has all 3 Phase 2 demo benchmark scenarios");

// Perturbation test 1: CF-104 Blockage (+3d delay on critical path)
const assamPerturbedCF104 = getProjectScheduleState(
  assamPrj,
  "cf104-blockage",
  simulateSchedulePerturbation,
  getScenarioById
);
assert(assamPerturbedCF104.targetNode.id === "CF-104", "CF-104 is target disturbed node");
assert(assamPerturbedCF104.isProjectFinishDelayed === true, "Project finish is delayed by CF-104");
assert(assamPerturbedCF104.projectDelayDays === 3, "Project finish slips by exactly +3 days (Day 30 -> 33)");
assert(assamPerturbedCF104.milestoneExposure["M-03"].perturbedEF === 33, "Terminal milestone M-03 perturbed finish is Day 33");

// Perturbation test 2: MP-301 Delay (+2d float buffer absorption)
const assamPerturbedMP301 = getProjectScheduleState(
  assamPrj,
  "mp301-delay",
  simulateSchedulePerturbation,
  getScenarioById
);
assert(assamPerturbedMP301.targetNode.id === "MP-301", "MP-301 is target disturbed node");
assert(assamPerturbedMP301.isProjectFinishDelayed === false, "MP-301 delay is absorbed in float (0d project slippage)");
assert(assamPerturbedMP301.projectDelayDays === 0, "Project finish remains Day 30");
console.log("  Step 4 Passed.\n");

// ----------------------------------------------------------------------------
// STEP 5: Switch back to Rajasthan (Verify Zero State Leakage)
// ----------------------------------------------------------------------------
console.log("STEP 5: Switch back to Rajasthan (Verify Zero Stale State Leakage)");
// When user switches to Rajasthan, activeScenarioId is cleared to null
const rajScheduleState2 = getProjectScheduleState(rajasthanPrj, null, simulateSchedulePerturbation, getScenarioById);

assert(rajScheduleState2.disturbance.activityId === null, "Post-switch Rajasthan has NO disturbance");
assert(rajScheduleState2.isProjectFinishDelayed === false, "Post-switch Rajasthan is NOT delayed");
assert(rajScheduleState2.projectDelayDays === 0, "Post-switch Rajasthan delay days is 0 (no Assam +3d leakage)");
assert(rajScheduleState2.targetNode.id !== "CF-104", "Post-switch target node is NOT CF-104");
assert(rajScheduleState2.targetNode.id !== "MP-301", "Post-switch target node is NOT MP-301");
assert(rajScheduleState2.perturbedActivities.length === 8, "Post-switch activities array has 8 nodes (not 14)");
assert(rajScheduleState2.milestoneExposure["M-03"] === undefined, "Post-switch milestone exposure has NO M-03");
assert(rajScheduleState2.milestoneExposure["M-04"] !== undefined, "Post-switch milestone exposure has M-04 (Day 90)");
assert(rajScheduleState2.erodedActivities.length === 0, "Post-switch eroded activities list is empty");
console.log("  Step 5 Passed.\n");

// ----------------------------------------------------------------------------
// STEP 6: Switch back to Alpha (Verify Simulation Works & Zero Rajasthan Leakage)
// ----------------------------------------------------------------------------
console.log("STEP 6: Switch back to Alpha (Verify Alpha Simulation Still Works & Zero Rajasthan Leakage)");
// Verify alias resolution for Alpha Facility
const alphaByAlias1 = getProjectById("alpha-facility");
const alphaByAlias2 = getProjectById("alpha-facility-assam");
assert(alphaByAlias1 !== null && alphaByAlias1.id === "alpha-facility-assam", "Alpha resolves via 'alpha-facility' alias");
assert(alphaByAlias2 !== null && alphaByAlias2.id === "alpha-facility-assam", "Alpha resolves via canonical ID");

// Verify Rajasthan alias resolution
const rajByAlias1 = getProjectById("thar-solar");
const rajByAlias2 = getProjectById("rajasthan");
assert(rajByAlias1 !== null && rajByAlias1.id === "thar-solar-rajasthan", "Rajasthan resolves via 'thar-solar' alias");
assert(rajByAlias2 !== null && rajByAlias2.id === "thar-solar-rajasthan", "Rajasthan resolves via 'rajasthan' alias");

// When returning to Alpha, default scenario 'cf104-blockage' is restored
const alphaRestoredState = getProjectScheduleState(
  alphaByAlias1,
  alphaByAlias1.defaultScenarioId,
  simulateSchedulePerturbation,
  getScenarioById
);
assert(alphaRestoredState.targetNode.id === "CF-104", "Restored Alpha target node is CF-104");
assert(alphaRestoredState.isProjectFinishDelayed === true, "Restored Alpha simulation is active (delayed finish)");
assert(alphaRestoredState.projectDelayDays === 3, "Restored Alpha finish variance is +3 days");
assert(alphaRestoredState.milestoneExposure["M-03"].perturbedEF === 33, "Restored Alpha terminal finish is Day 33");
assert(alphaRestoredState.milestoneExposure["M-04"] === undefined, "Restored Alpha has NO Rajasthan M-04 milestone");
assert(alphaRestoredState.perturbedActivities.length === 14, "Restored Alpha has all 14 industrial WBS nodes");

// Verify no Rajasthan solar activities leaked into Alpha
const alphaRestoredIds = alphaRestoredState.perturbedActivities.map(a => a.id);
const rajasthanOnlyIds = ["SP-101", "SP-201", "SP-204", "SP-208", "EE-302", "M-02", "TC-501", "M-04"];
for (const rId of rajasthanOnlyIds) {
  assert(!alphaRestoredIds.includes(rId), `Restored Alpha must NOT contain Rajasthan activity ${rId}`);
}
console.log("  Step 6 Passed.\n");

console.log("===============================================================================");
console.log(` ✅ ALL 6-STEP PHASE 3 CONTEXT & TRANSITION CHECKS PASSED (${passedAssertions} ASSERTIONS) `);
console.log("===============================================================================");
