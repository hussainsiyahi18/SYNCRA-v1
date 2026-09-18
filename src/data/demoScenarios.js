/**
 * SYNCRA — High-Fidelity Demo Scenarios
 *
 * Defines the three standard interactive demonstration scenarios:
 * 1. CF-104 Critical Blockage (+3 days delay ➔ Project finish slips from Day 30 to Day 33)
 * 2. MP-301 Piping Delay (+1 day delay ➔ Float buffer absorbed, Project finish stays Day 30)
 * 3. Ambiguous Civil Field Signal (Low margin +4 pp ➔ Routed to Human Review Queue)
 */

export const DEMO_SCENARIOS = [
  {
    id: "cf104-blockage",
    name: "Scenario 1: CF-104 Boulder Blockage (+3d)",
    badge: "CRITICAL PATH SLIPPAGE",
    badgeType: "danger",
    activityId: "CF-104",
    activityName: "Foundation Excavation",
    wbs: "1.2.1.04",
    discipline: "Civil & Groundworks",
    workfront: "Grid A-14",
    delayDays: 3,
    newStatus: "Blocked",
    reason: "Unmapped boulder obstruction at Grid A-14 pit",
    reportText:
      "Excavation stopped at Grid A-14 after encountering unexpected buried concrete/boulder structure. Excavator EX-07 blocked, approx 62% progress. Need rock breaker clearance.",
    quantityProgress: 62,
    evidenceCount: 4,
    expectedGate: "AUTO-ACCEPT",
    expectedProjectFinish: 33,
    expectedProjectDelay: 3,
    narrative:
      "Demonstrates critical path propagation: CF-104 delay propagates along the driving chain (CF-108 ➔ CS-201 ➔ TC-401 ➔ M-03), pushing project completion from Day 30 to Day 33."
  },
  {
    id: "mp301-delay",
    name: "Scenario 2: MP-301 Laydown Delay (+1d)",
    badge: "FLOAT ABSORPTION",
    badgeType: "warning",
    activityId: "MP-301",
    activityName: "Header Piping Spool Fabrication",
    wbs: "1.3.2.01",
    discipline: "Mechanical & Piping",
    workfront: "Sector B-02",
    delayDays: 1,
    newStatus: "Delayed",
    reason: "Spool transport congestion in Sector B-02 laydown",
    reportText:
      "Header piping spool fabrication at Sector B-02 delayed by 1 day due to crane congestion in staging laydown. Welder gang diverted temporarily.",
    quantityProgress: 35,
    evidenceCount: 3,
    expectedGate: "AUTO-ACCEPT",
    expectedProjectFinish: 30,
    expectedProjectDelay: 0,
    narrative:
      "Demonstrates float buffer resilience: MP-301 has 1 day of available total float. The 1-day disruption is absorbed (TF drops from +1 to 0) without delaying the project finish date (Day 30 preserved)."
  },
  {
    id: "ambiguous-civil",
    name: "Scenario 3: Ambiguous Log (CF-104 vs CF-105)",
    badge: "HUMAN REVIEW QUEUE",
    badgeType: "review",
    activityId: "CF-104",
    activityName: "Foundation Trench / Rebar Assembly",
    wbs: "1.2.1.04 / 1.2.1.05",
    discipline: "Civil & Groundworks",
    workfront: "Grid A-14",
    delayDays: 2,
    newStatus: "Under Review",
    reason: "Candidate ambiguity between adjacent civil packages",
    reportText:
      "Trenching depth check and rebar staging near Grid A-14 foundation corner. Crew on standby awaiting engineering level mark.",
    quantityProgress: 50,
    evidenceCount: 2,
    expectedGate: "REVIEW",
    expectedProjectFinish: 30, // unperturbed until confirmed
    expectedProjectDelay: 0,
    narrative:
      "Demonstrates gate safety: Candidate separation is only +4 pp (<15 pp threshold) between CF-104 and CF-105. Event is routed to human review, preventing premature schedule disruption."
  }
];

export function getScenarioById(id) {
  return DEMO_SCENARIOS.find(s => s.id === id) || DEMO_SCENARIOS[0];
}
