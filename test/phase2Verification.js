import { simulateSchedulePerturbation } from "../src/data/scheduleSimulation.js";
import { evaluateFieldSignal } from "../src/data/confidenceEngine.js";
import { DEMO_SCENARIOS } from "../src/data/demoScenarios.js";

console.log("=== SYNCRA PHASE 2 CLOSED-LOOP EXECUTION VERIFICATION ===");

// -----------------------------------------------------------------------------
// TEST 1: Scenario 1 (CF-104 Critical Blockage, +3d Delay)
// -----------------------------------------------------------------------------
console.log("\n>>> TESTING SCENARIO 1: CF-104 Critical Blockage (+3d)");
const sc1 = DEMO_SCENARIOS[0];
const sim1 = simulateSchedulePerturbation(undefined, {
  activityId: sc1.activityId,
  delayDays: sc1.delayDays,
  newStatus: sc1.newStatus,
  reason: sc1.reason
});
const eval1 = evaluateFieldSignal({ scenarioKey: sc1.id });

console.log("Simulated Project Finish (M-03): Day", sim1.milestoneExposure["M-03"].perturbedEF);
console.log("Calculated Project Delay:", sim1.projectDelayDays, "days");
console.log("M-01 Handover Milestone Finish: Day", sim1.milestoneExposure["M-01"].perturbedEF);
console.log("Exposed Driving Chain:", sim1.exposedCriticalChain.map(n => `${n.id} (EF:${n.earlyFinish})`).join(" -> "));
console.log("Gate Routing:", eval1.gateRouting, "| Margin:", `+${eval1.margin} pp`, "| Confidence:", `${eval1.confidence}%`);

if (sim1.projectDelayDays !== 3) {
  throw new Error(`Scenario 1 failed: expected project delay of 3 days, got ${sim1.projectDelayDays}`);
}
if (sim1.milestoneExposure["M-03"].perturbedEF !== 33) {
  throw new Error(`Scenario 1 failed: expected M-03 finish at Day 33, got ${sim1.milestoneExposure["M-03"].perturbedEF}`);
}
if (sim1.milestoneExposure["M-01"].perturbedEF !== 24) {
  throw new Error(`Scenario 1 failed: expected M-01 finish at Day 24, got ${sim1.milestoneExposure["M-01"].perturbedEF}`);
}
if (!eval1.isAutoAccept || eval1.gateRouting !== "AUTO-ACCEPT") {
  throw new Error(`Scenario 1 gate failed: expected AUTO-ACCEPT, got ${eval1.gateRouting}`);
}
if (eval1.margin !== 33) {
  throw new Error(`Scenario 1 margin failed: expected +33 pp, got +${eval1.margin} pp`);
}
console.log("✓ SCENARIO 1 VERIFIED: CF-104 blockage dynamically slips project finish from Day 30 to Day 33.");

// -----------------------------------------------------------------------------
// TEST 2: Scenario 2 (MP-301 Piping Delay, +1d Delay - Float Absorption)
// -----------------------------------------------------------------------------
console.log("\n>>> TESTING SCENARIO 2: MP-301 Piping Delay (+1d - Float Absorption)");
const sc2 = DEMO_SCENARIOS[1];
const sim2 = simulateSchedulePerturbation(undefined, {
  activityId: sc2.activityId,
  delayDays: sc2.delayDays,
  newStatus: sc2.newStatus,
  reason: sc2.reason
});
const eval2 = evaluateFieldSignal({ scenarioKey: sc2.id });

console.log("Simulated Project Finish (M-03): Day", sim2.milestoneExposure["M-03"].perturbedEF);
console.log("Calculated Project Delay:", sim2.projectDelayDays, "days");
console.log("MP-301 Baseline TF:", sim2.baselineActivities.find(a => a.id === "MP-301").totalFloat);
console.log("MP-301 Perturbed TF:", sim2.targetNode.totalFloat);
console.log("MP-301 Delta TF:", sim2.deltaFloatMap["MP-301"], "days");
console.log("Gate Routing:", eval2.gateRouting, "| Margin:", `+${eval2.margin} pp`, "| Confidence:", `${eval2.confidence}%`);

if (sim2.projectDelayDays !== 0) {
  throw new Error(`Scenario 2 failed: expected 0 days project delay, got ${sim2.projectDelayDays}`);
}
if (sim2.milestoneExposure["M-03"].perturbedEF !== 30) {
  throw new Error(`Scenario 2 failed: expected M-03 finish preserved at Day 30, got ${sim2.milestoneExposure["M-03"].perturbedEF}`);
}
if (sim2.targetNode.totalFloat !== 0 || sim2.deltaFloatMap["MP-301"] !== -1) {
  throw new Error(`Scenario 2 float failed: expected TF to drop from 1 to 0 (delta: -1), got ${sim2.targetNode.totalFloat}`);
}
if (!eval2.isAutoAccept || eval2.gateRouting !== "AUTO-ACCEPT") {
  throw new Error(`Scenario 2 gate failed: expected AUTO-ACCEPT, got ${eval2.gateRouting}`);
}
console.log("✓ SCENARIO 2 VERIFIED: MP-301 delay absorbed by available float without project completion slippage.");

// -----------------------------------------------------------------------------
// TEST 3: Scenario 3 (Ambiguous Civil Log - CF-104 vs CF-105)
// -----------------------------------------------------------------------------
console.log("\n>>> TESTING SCENARIO 3: Ambiguous Civil Log (CF-104 vs CF-105)");
const sc3 = DEMO_SCENARIOS[2];
const eval3 = evaluateFieldSignal({ scenarioKey: sc3.id });

console.log("Top Candidate:", eval3.topCandidate.id, `(${eval3.topCandidate.score}%)`);
console.log("Second Candidate:", eval3.secondCandidate.id, `(${eval3.secondCandidate.score}%)`);
console.log("Candidate Margin:", `+${eval3.margin} pp`, "(Threshold >= 15 pp)");
console.log("Gate Routing:", eval3.gateRouting);

if (eval3.margin >= 15) {
  throw new Error(`Scenario 3 failed: expected margin < 15 pp, got ${eval3.margin}`);
}
if (eval3.isAutoAccept || eval3.gateRouting !== "REVIEW") {
  throw new Error(`Scenario 3 gate failed: expected REVIEW routing, got ${eval3.gateRouting}`);
}
console.log("✓ SCENARIO 3 VERIFIED: Candidate margin of +4 pp safely routed to Human Review Queue.");

console.log("\n===================================================================");
console.log(">>> ALL 3 PHASE 2 CLOSED-LOOP SCENARIOS MATHEMATICALLY VERIFIED! <<<");
console.log("===================================================================");
