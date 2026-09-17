# SYNCRA — Phased Implementation Roadmap

**Current State**: Monolithic Frontend Prototype (`syncra-v1`)  
**Target State**: Realistic End-to-End Multi-Activity EPC Construction Simulation  
**Strategy**: Incremental evolution without breaking working prototype features

---

## Phase Overview

```mermaid
graph LR
    P1[Phase 1: Foundation & Data Model] --> P2[Phase 2: CPM Schedule Engine]
    P2 --> P3[Phase 3: Dynamic Field Reporting]
    P3 --> P4[Phase 4: Dynamic Impact & Recovery]
    P4 --> P5[Phase 5: Modularization & Polish]
```

---

## Phase 1: Foundation, Quick Fixes & Realistic EPC Dataset
*Goal: Fix known prototype defects and build a realistic multi-activity construction dataset for "Alpha Facility".*

- [x] **1.1 Fix Role-Based Navigation Bug**:
  - Normalized `userRole` comparison in [`src/App.jsx`](file:///c:/Users/hp/syncra-v1/src/App.jsx) so Project Managers see designated management navigation and supervisors see field execution navigation. Direct 1-click persona logins enabled.
- [x] **1.2 Design Alpha Facility WBS & Schedule Dataset & Topological CPM Engine**:
  - Defined 14 interconnected activities and milestones across Civil, Mechanical, Electrical, and Testing in [`src/data/alphaFacilityData.js`](file:///c:/Users/hp/syncra-v1/src/data/alphaFacilityData.js).
  - Pure CPM engine dynamically derives ES, EF, LS, LF, total float, free float, and critical paths without hardcoded flags.
  - Decoupled side milestone `M-01` (`TF = +9`) from terminal completion constraint `M-03` (`LF = 30`).
- [x] **1.3 Programmatic & UI Verification**:
  - 100% reciprocal topology verified (`validateScheduleTopology()`).
  - Critical paths verified: Baseline `CF-101 → CF-104 → CF-108 → CS-201 → TC-401 → M-03`; Active `CF-104 → CF-108 → CS-201 → TC-401 → M-03`.
  - All non-critical activities mathematically verified with `totalFloat > 0`.
  - `npm run build` exits 0 (644ms); `npx oxlint` exits 0 with 0 errors/warnings.

---

## Phase 2: Lightweight Schedule Engine (CPM & Float Calculation)
*Goal: Move from hardcoded "+3 days / 1 day float" strings to real deterministic schedule calculations.*

- [ ] **2.1 Implement CPM Graph Engine (`cpmEngine.js`)**:
  - Calculate early start (ES), early finish (EF), late start (LS), late finish (LF), total float (TF), and free float (FF).
  - Identify the active Critical Path through topological sort.
- [ ] **2.2 Impact Simulation Functions**:
  - Given an activity delay or blockage (e.g. `CF-104` +3 days), calculate downstream float consumption and milestone variance dynamically.
- [ ] **2.3 Verification**:
  - Unit-verify forward/backward pass with known test DAGs to confirm float and critical path calculations match EPC standard rules.

---

## Phase 3: Dynamic Field Reporting & Activity Resolution
*Goal: Enable field supervisors to report on different activities and simulate the AI extraction/matching pipeline.*

- [ ] **3.1 Multi-Activity Report Submission**:
  - Allow supervisor to select or input reports for different workfronts (e.g., Grid A-14 Civil, Header Piping Area B, Substation Cable Pulling).
- [ ] **3.2 Activity Resolution & Confidence Scoring**:
  - Implement heuristic/semantic matcher that maps raw field report text + discipline to the corresponding WBS Activity ID.
  - Calculate multi-factor confidence metrics (e.g., photo count, crew log consistency, location precision).
- [ ] **3.3 Event Broadcast**:
  - Ensure dynamic event payloads are transmitted via `BroadcastChannel` with full activity metadata.
- [ ] **3.4 Verification**:
  - Submit reports for different activities in Domain Supervisor view; verify Manager view receives and resolves the specific activity dynamically.

---

## Phase 4: Dynamic Network Impact & Recovery Scenario Generator
*Goal: Replace static recovery options with contextual recovery scenarios driven by the schedule engine.*

- [ ] **4.1 Dynamic Network Impact Visualization**:
  - Render the actual exposed dependency chain (`Blocked Activity ➔ Successor ➔ Milestone`) generated from the CPM engine.
  - Display actual consumed float vs. remaining buffer.
- [ ] **4.2 Context-Aware Recovery Options**:
  - Algorithmic generation of 3 recovery options tailored to the active project state:
    - *Plan A (Resequence)*: Identify non-critical parallel workfronts with high float that can be pulled forward.
    - *Plan B (Resource Shift)*: Identify donor activities with surplus float whose equipment/labor can be reassigned.
    - *Plan C (Accept Variance)*: Compute exact project finish slippage if no action is taken.
- [ ] **4.3 Manager Approval & Working Schedule Update**:
  - Manager approves a chosen plan; system recalculates the working schedule, updates the forecast finish date, and leaves the baseline intact.
- [ ] **4.4 Verification**:
  - Walk through full end-to-end loop: Report issue on an activity ➔ see dynamic impact chain ➔ approve Plan A ➔ verify working forecast recovers while baseline remains preserved.

---

## Phase 5: Architecture Modularization & UI Polish
*Goal: Cleanly extract the monolithic files into reusable feature modules without regressing visuals or features.*

- [ ] **5.1 Modular Component Decomposition**:
  - Safely split `src/App.jsx` into focused feature folders (`features/auth`, `features/overview`, `features/field-reporting`, `features/intelligence`, `features/impact`, `features/recovery`, `features/audit`).
- [ ] **5.2 CSS Organization**:
  - Modularize `src/App.css` into token sheets and feature styles while preserving the dark industrial aesthetic and micro-animations.
- [ ] **5.3 End-to-End Regression & Simulation Walkthrough**:
  - Verify all scenarios (Civil blockage, Piping delay, Calibration gap) flow seamlessly through the complete platform.
