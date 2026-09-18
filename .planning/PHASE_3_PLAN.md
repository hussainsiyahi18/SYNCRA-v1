# GSD Phase 3 Plan: Generic Enterprise Platform Hierarchy & Multi-Project Isolation

**Phase**: 3 of 5  
**Status**: Plan Formulated (Awaiting User Review · DO NOT EXECUTE YET)  
**Goal**: Restructure SYNCRA from a single-facility app into an authentic generic enterprise project execution intelligence platform with generic login, workspace project directory, strict project context isolation (Assam vs. Rajasthan), and scoped secondary demo simulation controls.

---

## 1. Product Hierarchy & Architectural Principles

```
SYNCRA (Unified EPC Execution Intelligence)
  │
  ├── 1. Generic Login View
  │     - Facility-agnostic authentication
  │     - Personas: Project Manager & Lead Domain Supervisor
  │     - Zero project/facility bias
  │
  ├── 2. Workspace / Project Directory View
  │     - Top-level enterprise portfolio directory
  │     - Project selection cards (Assam Petrochemical vs. Rajasthan Solar)
  │     - Health indicators, critical path exposure, location badges
  │
  └── 3. Project Workspace Dashboard
        - Scoped strictly to the selected project context
        - Header breadcrumb: SYNCRA / Projects / [Project Name]
        - Quick "⇄ Switch Project" action
        - Selected project determines WBS dataset, status date, supervisor, and CPM network
        - Secondary demo simulation controls scoped only to demo project
```

---

## 2. Project Catalog Specification

### Project A: Alpha Facility Phase 2 (Assam)
- **ID**: `alpha-facility-assam`
- **Location**: Assam, India
- **Sector**: Petrochemical Complex (EPC Package 2)
- **Status Date**: Day 14 · Shift A (Baseline Finish: Day 30)
- **Schedule**: Full 14-node topological CPM network (`SCHEDULE_ACTIVITIES`)
- **Execution State**: Blocked on `CF-104` (Forecast Day 33, +3d variance)
- **Demo Scenarios**: Enabled (Scenario 1 Blockage, Scenario 2 Piping Delay, Scenario 3 Ambiguity)
- **Supervisor**: Arjun Sharma (Civil · Grid A-14)

### Project B: Thar Solar Complex Package 4 (Rajasthan)
- **ID**: `thar-solar-rajasthan`
- **Location**: Bikaner, Rajasthan, India
- **Sector**: 450 MW Ultra-Mega Solar PV & 220kV Grid Substation
- **Status Date**: Day 42 · Shift A (Baseline Finish: Day 90)
- **Schedule**: Distinct 8-node solar EPC network (`SP-101` through `M-04 COD`)
- **Execution State**: On Schedule (Forecast Day 90, 0d variance, healthy float)
- **Demo Scenarios**: Disabled / Production Monitoring
- **Supervisor**: Vikram Rathore (Electrical · Block C-08 Inverter Yard)

---

## 3. Planned Files

1. `src/data/projectsRegistry.js` (NEW):
   - Structured registry containing metadata and schedules for Assam and Rajasthan projects.
   - Accessor functions: `getAllProjects()`, `getProjectById()`.
2. `src/App.jsx` (MODIFY):
   - Strip Assam references from `LoginView`.
   - Implement `WorkspaceDirectoryView` rendered when user is authenticated but `selectedProjectId === null`.
   - Update header with breadcrumbs and `⇄ Switch Project` button.
   - Refactor scenario switcher from prominent topbar into secondary docked simulation drawer scoped to Alpha Facility.
   - Bind project dashboards to the active project context.
3. `src/App.css` (MODIFY):
   - Add styles for project directory cards, portfolio grid, switch project button, and docked demo sandbox.
4. `test/projectContextVerification.js` (NEW):
   - Programmatic tests asserting project separation, zero leakage of Assam activities into Rajasthan, and registry integrity.

---

## 4. Acceptance & Verification Criteria

1. **Generic Login**: Login page displays zero facility names or location strings.
2. **Workspace Selection**: Successful login navigates first to the Workspace Project Directory.
3. **Project Isolation**:
   - Selecting Rajasthan loads 8-node solar network, Day 42, Bikaner location, and 0d variance.
   - No Assam activities (`CF-104`, `CF-105`, `MP-301`, etc.) exist in the Rajasthan project context.
4. **Alpha Facility Integrity**:
   - Selecting Assam loads the complete 14-node schedule, Day 14 status, and Phase 2 CPM disturbance calculations.
5. **Switch Project**: Clicking `Switch Project` returns cleanly to the directory without logging out.
6. **Demo Switcher**: Restyled and scoped as a secondary simulation control.
7. **Code Quality & Tests**:
   - `node test/projectContextVerification.js` exits 0.
   - `node test/phase2Verification.js` exits 0.
   - `node test/cpmVerification.js` exits 0.
   - `npm run build` exits 0.
   - `npx oxlint` passes with 0 warnings/errors.
