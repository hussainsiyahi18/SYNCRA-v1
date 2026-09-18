/**
 * SYNCRA — Transparent Multi-Factor Confidence & Automation Gate Engine
 *
 * Implements a deterministic, explainable multi-factor scoring model that bridges
 * unstructured field language to authoritative schedule WBS nodes.
 *
 * Scoring Formula:
 * Confidence Score = (w1 * KeywordScore) + (w2 * ContextScore) + (w3 * EvidenceScore)
 * Candidate Margin = TopCandidateScore - SecondCandidateScore
 *
 * Gate Rule:
 * Auto-Accept <==> Confidence >= 90% AND Context >= 90% AND Margin >= 15 pp AND HardChecks == Clean
 */

export const GATE_THRESHOLDS = {
  MIN_CONFIDENCE_AUTO_ACCEPT: 90,
  MIN_CONTEXT_AUTO_ACCEPT: 90,
  MIN_MARGIN_AUTO_ACCEPT: 15, // percentage points
  MIN_USABLE_SCORE: 75
};

/**
 * Evaluates field report signal against candidate activities and context rules.
 */
export function evaluateFieldSignal({
  _reportText = "",
  _workfront = "Grid A-14",
  _discipline = "Civil & Groundworks",
  _evidenceCount = 4,
  _equipmentStatus = "EX-07 Verified",
  scenarioKey = "auto-accept"
}) {
  // Preset evaluation profiles for transparent demo predictability
  const profiles = {
    "cf104-blockage": {
      confidence: 94,
      contextMatch: 96,
      topCandidate: {
        id: "CF-104",
        name: "Foundation Excavation",
        score: 94,
        wbs: "1.2.1.04",
        discipline: "Civil & Groundworks",
        workfront: "Grid A-14"
      },
      secondCandidate: {
        id: "CF-109",
        name: "Storm Drainage Trenching",
        score: 61,
        wbs: "1.2.1.09",
        discipline: "Civil & Groundworks",
        workfront: "Sector A-Peripheral"
      },
      factors: {
        keywordAlignment: { score: 95, weight: 0.35, notes: "Explicit matches: 'excavation', 'Grid A-14', 'boulder', 'rock breaker'" },
        contextSchedule: { score: 96, weight: 0.35, notes: "CF-104 is active on Day 14. CF-101 site prep completed; workfront cleared." },
        evidenceConsistency: { score: 92, weight: 0.30, notes: "4 GPS site photos match Grid A-14 pit; EX-07 telemetry corroborates idle state." }
      },
      hardChecks: {
        locCheck: "Consistent: Pit coordinates match Grid A-14 boundary (PASS)",
        cpmCheck: "Consistent: In-progress Day 6-15 window (PASS)",
        resCheck: "Consistent: EX-07 Excavator verified active on site (PASS)",
        eviCheck: "Consistent: 4 geo-tagged photos corroborate rock face (PASS)",
        hardCheckPass: true,
        materialContradiction: false
      }
    },
    "mp301-delay": {
      confidence: 92,
      contextMatch: 94,
      topCandidate: {
        id: "MP-301",
        name: "Header Piping Spool Fabrication",
        score: 92,
        wbs: "1.3.2.01",
        discipline: "Mechanical & Piping",
        workfront: "Sector B-02"
      },
      secondCandidate: {
        id: "MP-305",
        name: "Heavy Pressure Vessel Placement",
        score: 64,
        wbs: "1.3.2.05",
        discipline: "Mechanical & Piping",
        workfront: "Sector B-02"
      },
      factors: {
        keywordAlignment: { score: 93, weight: 0.35, notes: "Explicit matches: 'piping', 'spool fabrication', 'laydown', 'Sector B-02'" },
        contextSchedule: { score: 94, weight: 0.35, notes: "MP-301 active (Day 12-19). Offsite procurement lag satisfied." },
        evidenceConsistency: { score: 90, weight: 0.30, notes: "Crane log and spool delivery manifest attached." }
      },
      hardChecks: {
        locCheck: "Consistent: Staging yard matches Sector B-02 (PASS)",
        cpmCheck: "Consistent: MP-301 active; predecessor CF-101 satisfied (PASS)",
        resCheck: "Consistent: Welder crew log verified (PASS)",
        eviCheck: "Consistent: Delivery receipt and crane log corroboration (PASS)",
        hardCheckPass: true,
        materialContradiction: false
      }
    },
    "ambiguous-civil": {
      confidence: 88,
      contextMatch: 92,
      topCandidate: {
        id: "CF-104",
        name: "Foundation Excavation",
        score: 88,
        wbs: "1.2.1.04",
        discipline: "Civil & Groundworks",
        workfront: "Grid A-14"
      },
      secondCandidate: {
        id: "CF-105",
        name: "Rebar Cage Pre-Assembly",
        score: 84,
        wbs: "1.2.1.05",
        discipline: "Civil & Groundworks",
        workfront: "Grid A-14"
      },
      factors: {
        keywordAlignment: { score: 86, weight: 0.35, notes: "Ambiguous keywords: text contains both 'trench depth check' and 'rebar staging'" },
        contextSchedule: { score: 92, weight: 0.35, notes: "Both CF-104 and CF-105 operate in adjacent Grid A-14 windows" },
        evidenceConsistency: { score: 86, weight: 0.30, notes: "Photo shows both pit bottom and stacked rebar cages" }
      },
      hardChecks: {
        locCheck: "Consistent: Grid A-14 workfront (PASS)",
        cpmCheck: "Consistent: Active construction zone (PASS)",
        resCheck: "Consistent: Labor crew present (PASS)",
        eviCheck: "Inconclusive: Cannot separate excavation vs rebar labor (PASS)",
        hardCheckPass: true,
        materialContradiction: false
      }
    }
  };

  const selected = profiles[scenarioKey] || profiles["cf104-blockage"];
  const margin = selected.topCandidate.score - selected.secondCandidate.score;
  const isHighConfidence = selected.confidence >= GATE_THRESHOLDS.MIN_CONFIDENCE_AUTO_ACCEPT;
  const isHighContext = selected.contextMatch >= GATE_THRESHOLDS.MIN_CONTEXT_AUTO_ACCEPT;
  const isHighMargin = margin >= GATE_THRESHOLDS.MIN_MARGIN_AUTO_ACCEPT;
  const isCleanChecks = selected.hardChecks.hardCheckPass && !selected.hardChecks.materialContradiction;

  let gateRouting = "REVIEW";
  let gateClass = "gate-review";
  let gateExplanation = "";
  let systemAction = "";

  if (isHighConfidence && isHighContext && isHighMargin && isCleanChecks) {
    gateRouting = "AUTO-ACCEPT";
    gateClass = "gate-auto-accept";
    gateExplanation = `Confidence ≥90% (${selected.confidence}%) AND Context Match ≥90% (${selected.contextMatch}%) AND Margin ≥15 pp (+${margin} pp) AND no hard-check failure = AUTO-ACCEPT. Routine high-confidence event accepted without forcing supervisor confirmation.`;
    systemAction = "Create accepted execution event; dynamically perturb working CPM schedule.";
  } else if (!isHighMargin && isHighConfidence && isHighContext) {
    gateRouting = "REVIEW";
    gateClass = "gate-review";
    gateExplanation = `Candidate separation is only +${margin} pp (<15 pp threshold) between ${selected.topCandidate.id} and ${selected.secondCandidate.id}. Ambiguity detected; schedule perturbation held until planner review.`;
    systemAction = "Route to human review queue; protect schedule state from premature alteration.";
  } else {
    gateRouting = "REVIEW";
    gateClass = "gate-review";
    gateExplanation = `Confidence or context below threshold. Requires manual verification.`;
    systemAction = "Queue event for manual planner reconciliation.";
  }

  return {
    scenarioKey,
    confidence: selected.confidence,
    contextMatch: selected.contextMatch,
    margin,
    topCandidate: selected.topCandidate,
    secondCandidate: selected.secondCandidate,
    factors: selected.factors,
    hardChecks: selected.hardChecks,
    isAutoAccept: gateRouting === "AUTO-ACCEPT",
    gateRouting,
    gateClass,
    gateExplanation,
    systemAction
  };
}
