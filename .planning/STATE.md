# SYNCRA — Current Project State

**Last Updated**: 2026-09-18  
**Completed Phase**: Phase 3 — Enterprise Workspace, Facility-Agnostic Application Shell & Strict Context Isolation  
**Status**: Phase 3 Complete & Programmatically Verified  
**Plan Reference**: [PHASE_3_PLAN.md](file:///c:/Users/hp/syncra-v1/.planning/PHASE_3_PLAN.md)  

---

## Current Situation
- **Enterprise Project Registry (`src/data/projectsRegistry.js`)**:
  - Encapsulates multi-project definitions with isolated WBS datasets, status dates, supervisors, attention signals, and capabilities.
  - Implements `getProjectScheduleState(project, ...)` helper that avoids scattering project-specific conditional checks across `App.jsx`.
  - Defined two distinct capital projects:
    1. `alpha-facility-assam`: 14-node petrochemical complex, Day 14 status, Phase 2 simulation sandbox enabled.
    2. `thar-solar-rajasthan`: Lightweight 8-node solar EPC network, Day 42 status, Day 90 COD baseline, nominal execution (0d variance), simulation sandbox disabled.
- **Facility-Agnostic Application Shell (`src/App.jsx`, `src/App.css`)**:
  - **Login View**: Generic enterprise access (`Sign in to SYNCRA`, `ENTERPRISE ACCESS`) with no facility-specific names, logos, or activities.
  - **Enterprise Workspace View (`WorkspaceDirectoryView`)**: Global project directory displaying capital project cards, regional distribution, portfolio statistics, and one-click project workspace opening.
  - **Context Isolation & Navigation**:
    - Topbar breadcrumb (`Projects / {Project Name} ({Location})`) and dedicated `⇄ Switch Project` button.
    - Sidebar active project badge with switcher button.
  - **Secondary Demo Simulation Sandbox**:
    - Scoped exclusively to projects with `capabilities.hasSimulationSandbox` (Assam).
    - Styled as a distinct secondary disturbance injection drawer without masquerading as standard production navigation.
    - Non-demo projects (Rajasthan) display a clean `PRODUCTION RUNTIME` status strip.
- **Verification & Code Quality**:
  - `test/projectContextVerification.js`: 47 automated assertions validating the 5-step verification flow:
    1. Login / Shell facility-agnostic integrity.
    2. Workspace directory multiple-project catalog resolution.
    3. Rajasthan context isolation (zero Assam activities: no CF-104, CF-105, MP-301).
    4. Assam context (14-node schedule + Phase 2 dynamic simulation).
    5. Return to Rajasthan (zero stale Assam/scenario state leakage, 0d delay, Day 90 baseline).
  - `test/cpmVerification.js`: 100% Phase 1 baseline CPM passes.
  - `test/phase2Verification.js`: 100% Phase 2 closed-loop simulation passes.
  - `npm run build`: Production bundle built clean with 0 errors.
  - `npx oxlint`: 0 warnings, 0 errors.

---

## Next Steps
- Production readiness, user presentation alignment, and packaging.
