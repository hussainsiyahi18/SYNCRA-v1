# GSD Phase 2 Plan: Closed-Loop Execution Intelligence & CPM Perturbation Prototype

**Phase**: 2 of 5  
**Status**: Plan Formulated (Awaiting User Review · DO NOT EXECUTE YET)  
**Goal**: Build the complete interactive closed-loop execution intelligence loop (Signal ➔ Multi-Factor Gate ➔ Dynamic Perturbation ➔ Downstream Impact & Float Erosion ➔ Milestone Variance ➔ Updated Schedule) as a high-fidelity prototype across 3 interactive scenarios with zero hardcoded impact figures.

---

## 1. Scope & System Boundaries

### In Scope (High-Fidelity Demo)
- Real dynamic CPM perturbation engine (`simulateSchedulePerturbation`) derived from Phase 1 schedule data.
- Transparent, deterministic multi-factor confidence scoring model ($0.35 \text{ keyword} + 0.35 \text{ context} + 0.30 \text{ evidence} + \text{hard checks}$).
- Three distinct interactive scenarios:
  1. `CF-104` boulder obstruction (+3d delay) ➔ Auto-Accepted ➔ M-03 dynamically slips Day 30 to Day 33.
  2. `MP-301` piping delay (+1d delay) ➔ Auto-Accepted ➔ Float absorbed ($\text{TF} \to 0$), M-03 stays Day 30.
  3. Ambiguous field log (`CF-104` vs `CF-105`) ➔ Candidate margin +4 pp (<15 pp) ➔ Routed to Human Review.
- Lightweight scenario switcher chip bar in demo UI.
- Reactive UI data binding in `ImpactView` and `UpdatedStateView` (replacing static mock strings).

### Out of Scope (Explicit Non-Goals)
- Production databases, backend persistence, ORM schemas.
- Black-box AI claims, live LLM integrations, production OCR models.
- Enterprise ERP / Primavera P6 integrations.
- Broad CSS or component refactoring.

---

## 2. Mathematical Specification for Schedule Perturbation

### Forward Pass Perturbation
Given disturbance $\{ \text{activityId}, \Delta D, \text{status}, \text{reason} \}$:
1. Target activity's forecast duration is updated: $D' = D + \Delta D$.
2. Target activity's early finish shifts: $\text{EF}' = \text{ES} + D' - 1 = \text{EF} + \Delta D$.
3. Downstream propagation follows standard inclusive CPM forward pass:
   - For FS link with lag $L$: $\text{ES}_{\text{succ}} = \max(\text{EF}'_{\text{pred}} + 1 + L)$.
4. Terminal milestone finish date:
   $$\text{EF}'_{M\text{-}03} = \text{EF}'_{TC\text{-}401} + 1$$
5. Project delay variance:
   $$\Delta \text{Finish} = \text{EF}'_{M\text{-}03} - 30$$

### Backward Pass & Float Erosion
1. Backward pass initialized from perturbed project completion: $\text{LF}'_{M\text{-}03} = \text{EF}'_{M\text{-}03}$.
2. Propagated backward through all nodes.
3. Delta float calculation for all 14 nodes:
   $$\Delta \text{TF}_i = \text{TF}'_i - \text{TF}_i$$
4. Float erosion detected when $\Delta \text{TF}_i < 0$.

---

## 3. The Three Scenario Definitions

### Scenario 1: `CF-104` Critical Blockage
- **Field Text**: `"Excavation stopped at Grid A-14 after encountering unexpected buried boulder structure. Excavator EX-07 blocked, approx 62% progress. Need rock breaker clearance."`
- **Disturbance**: `CF-104`, $\Delta D = +3\text{d}$.
- **Gate Output**: Auto-Accept (Confidence: 94%, Margin: +33 pp, Context: 96%, Hard Checks: PASS).
- **CPM Impact**:
  - `CF-104`: EF 15 ➔ 18
  - `CF-108`: ES 16 ➔ 19, EF 21 ➔ 24
  - `M-01`: Day 21 ➔ Day 24 ($\text{TF} = +9 \to +6$)
  - `CS-201`: ES 22 ➔ 25, EF 27 ➔ 30
  - `TC-401`: ES 28 ➔ 31, EF 29 ➔ 32
  - `M-03`: Day 30 ➔ Day 33 ($\Delta = +3\text{d}$ project delay)

### Scenario 2: `MP-301` Laydown Delay (Float Absorption)
- **Field Text**: `"Header piping spool fabrication at Sector B-02 delayed by 1 day due to crane congestion in staging laydown. Welder gang diverted temporarily."`
- **Disturbance**: `MP-301`, $\Delta D = +1\text{d}$.
- **Gate Output**: Auto-Accept (Confidence: 92%, Margin: +28 pp, Context: 94%, Hard Checks: PASS).
- **CPM Impact**:
  - `MP-301`: EF 19 ➔ 20. Total Float: $1 \to 0$ ($\Delta \text{TF} = -1\text{d}$, float buffer absorbed).
  - `MP-305`: Starts Day 22 (driven by `CF-108` finish on Day 21).
  - `M-03`: Day 30 ($\Delta = 0\text{d}$ project delay).

### Scenario 3: `CF-104` vs `CF-105` Ambiguity
- **Field Text**: `"Trenching depth check and rebar staging near Grid A-14 foundation corner. Crew on standby awaiting engineering level mark."`
- **Candidate Scores**: `CF-104`: 88%, `CF-105`: 84%.
- **Candidate Margin**: $+4\text{ pp}$ ($< 15\text{ pp}$ threshold).
- **Gate Output**: `REVIEW` (Flagged: Candidate Ambiguity, routed to planner queue).
- **CPM Impact**: Schedule remains protected until planner confirms assignment.

---

## 4. Planned Files

1. `src/data/scheduleSimulation.js` (NEW): Perturbation engine and float erosion analyzer.
2. `src/data/confidenceEngine.js` (NEW): Deterministic multi-factor scoring and automation gate evaluator.
3. `src/data/demoScenarios.js` (NEW): Declarative scenario presets and metadata.
4. `src/App.jsx` (MODIFY): Integrate scenario switcher, bind dynamic perturbation results to `ImpactView` and `UpdatedStateView`.
5. `test/phase2Verification.js` (NEW): Programmatic test suite asserting mathematical invariance across all 3 scenarios.

---

## 5. Acceptance & Verification Criteria

1. **Scenario 1 Calculation**: Programmatic test asserts `M-03` early finish is exactly Day 33, project delay is +3 days, and driving chain matches `CF-104 ➔ CF-108 ➔ CS-201 ➔ TC-401 ➔ M-03`.
2. **Scenario 2 Calculation**: Programmatic test asserts `M-03` early finish remains Day 30, project delay is 0, and `MP-301` total float drops from 1 to 0.
3. **Scenario 3 Gate Rule**: Programmatic test asserts candidate margin is +4 pp and gate decision is strictly `REVIEW`.
4. **Zero Hardcoding**: No static strings for delay days or dates in `ImpactView` and `UpdatedStateView`.
5. **Code Health**: `npm run build` exits 0; `npx oxlint` passes with 0 warnings/errors.
