# GSD Phase 1 Plan: Foundation, Role-Based Navigation & Realistic EPC Dataset (CPM Mathematical Specification)

**Phase**: 1 of 5  
**Status**: Revised Specification (Awaiting Final User Review · DO NOT EXECUTE YET)  
**Goal**: Establish an authoritative, mathematically coherent 14-activity EPC schedule dataset for the Alpha Facility project where CPM outputs (ES, EF, LS, LF, float, critical path) are dynamically calculated from raw input parameters, relationships are 100% bidirectionally verified, side milestone semantics are rigorously decoupled from terminal constraints, and App.jsx integrations remain minimally invasive.

---

## 1. Mathematical Convention & Formulas

### Inclusive Project-Day Convention (1-Based Days)
Construction EPC project schedules count working days inclusively:
- **Activity Duration ($D \ge 1$)**: An activity starting at the beginning of `Day S` finishes at the end of `Day F`:
  $$\text{EF} = \text{ES} + D - 1$$
- **Milestones ($D = 0$)**: Occurs at completion boundary: $\text{EF} = \text{ES}$.
- **Finish-to-Start (FS) with lag $L$**: Successor early start begins the day after predecessor early finish plus lag:
  $$\text{ES}_{\text{succ}} = \text{EF}_{\text{pred}} + 1 + L$$
- **Start-to-Start (SS) with lag $L$**:
  $$\text{ES}_{\text{succ}} = \text{ES}_{\text{pred}} + L$$

### Milestone Classification & Backward Pass Rules
In CPM networks, treating every leaf node (node with no successors) as a project terminal constraint is a known algorithmic error that distorts backward passes and creates false zero float or negative float.

1. **Terminal Constraint vs. Non-Terminal Leaf Nodes**:
   - **Project Terminal Milestone (`M-03`)**: The sole terminal finish constraint of the project network, anchored strictly at project completion:
     $$\text{LF}_{\text{terminal}} = 30 \quad (\text{anchored on } M\text{-}03)$$
   - **Non-Terminal Side Milestone (`M-01`)**: A reporting / handover milestone (`isTerminal: false`) with no driving successors to the terminal milestone. It occurs at Day 21 upon completion of `CF-108`. Because it does not represent contractual project finish, **it must NOT be assigned $\text{LF} = \text{EF} = 21$**. Assigning $\text{LF} = 21$ would falsely assign it zero float and, via standard FS backward propagation ($\text{LS}_s - 1 = 20$), would impose an invalid $\text{LF} \le 20$ on `CF-108` resulting in negative float ($\text{TF} = 20 - 21 = -1$).
   - **Correct Treatment of Non-Terminal Milestones**: Open-ended non-terminal side milestones inherit the project completion late boundary:
     $$\text{LF}_{M\text{-}01} = \text{ProjectFinish} = 30 \implies \text{LS}_{M\text{-}01} = 30$$
     $$\text{TotalFloat}_{M\text{-}01} = \text{LF} - \text{EF} = 30 - 21 = \mathbf{+9 \text{ days}}$$

2. **Backward Pass Formulas**:
   - **For Nodes with Successors**:
     $$\text{LF}_{\text{pred}} = \min_{s \in \text{Succ}} (\text{LateBoundaryDate}(s))$$
     Where for an FS successor with lag $L$:
     $$\text{LateBoundaryDate}(s) = \text{LS}_s - 1 - L$$
     And for an SS successor with lag $L$:
     $$\text{LateBoundaryDate}(s) = \text{LS}_s - L + D_{\text{pred}} - 1$$
   - **For Project Terminal Milestone (`M-03`, `isTerminal: true`)**:
     $$\text{LF} = \text{ProjectFinish} = 30$$
   - **For Non-Terminal Side Milestones (`M-01`, `isTerminal: false`, no successors)**:
     $$\text{LF} = \text{ProjectFinish} = 30$$
   - **Late Start**:
     $$\text{LS} = \text{LF} - D + 1 \quad (\text{for } D \ge 1), \quad \text{LS} = \text{LF} \quad (\text{for } D = 0)$$

### Float & Criticality Formulas
- **Total Float (TF)**:
  $$\text{TF} = \text{LS} - \text{ES} = \text{LF} - \text{EF}$$
- **Free Float (FF)** (for FS links):
  $$\text{FF} = \min_{s \in \text{Succ}}(\text{ES}_s - 1 - L) - \text{EF}$$
- **Criticality Definition**:
  $$\text{isCritical} \iff \text{TF} = 0 \land \text{ES} = \text{LS}$$

---

## 2. Authoritative Schedule Inputs (Raw Parameters Only)

Dates and floats are **not** authored here—only duration, WBS, discipline, workfront, predecessors, explicit lags, and milestone classification (`isTerminal`):

| Activity ID | WBS Node | Activity Name | Discipline | Workfront | Dur (Days) | Predecessors `[ID, Type, Lag]` | Node Class |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **CF-101** | `1.2.1.01` | Site Clearing & Grubbing | Civil & Groundworks | Grid A-14 | 5 | *None* | Activity |
| **CF-104** | `1.2.1.04` | Foundation Excavation | Civil & Groundworks | Grid A-14 | 10 | `[CF-101, FS, 0]` | Activity |
| **CF-105** | `1.2.1.05` | Rebar Cage Pre-Assembly | Civil & Groundworks | Grid A-14 | 4 | `[CF-104, SS, 4]` | Activity |
| **CF-108** | `1.2.1.08` | Concrete Foundation Pour & Curing | Civil & Groundworks | Grid A-14 | 6 | `[CF-104, FS, 0]`, `[CF-105, FS, 0]` | Activity |
| **CS-201** | `1.2.2.01` | Structural Steel Framing | Civil & Groundworks | Grid A-14 | 6 | `[CF-108, FS, 0]` | Activity |
| **MF-218** | `1.3.1.02` | Equipment Foundation Pedestals | Mechanical & Piping | Sector B-02 | 4 | `[CF-108, FS, 0]` | Activity |
| **MP-301** | `1.3.2.01` | Header Piping Spool Fabrication | Mechanical & Piping | Sector B-02 | 8 | `[CF-101, FS, 6]` *(6d offsite procurement lag)* | Activity |
| **MP-305** | `1.3.2.05` | Heavy Pressure Vessel Placement | Mechanical & Piping | Sector B-02 | 5 | `[CF-108, FS, 0]`, `[MP-301, FS, 2]` *(2d handling lag)* | Activity |
| **EI-310** | `1.4.1.01` | Cable Duct Bank Trenching | Electrical & Inst. | Substation C-1 | 6 | `[CF-101, FS, 2]` *(2d electrical survey lag)* | Activity |
| **EI-312** | `1.4.1.03` | MV/LV Feeder Cable Pulling | Electrical & Inst. | Substation C-1 | 7 | `[EI-310, FS, 0]` | Activity |
| **IN-320** | `1.4.2.01` | Field Instrument Calibration | Electrical & Inst. | Substation C-1 | 5 | `[EI-312, FS, 0]` | Activity |
| **TC-401** | `1.5.1.01` | Cold Loop & Hydro-Testing | Testing & Commissioning | Facility-wide | 2 | `[CS-201, FS, 0]`, `[MF-218, FS, 0]`, `[MP-305, FS, 0]`, `[IN-320, FS, 0]` | Activity |
| **M-01** | `1.2.1.99` | Civil Foundation Handover Milestone | Civil & Groundworks | Grid A-14 | 0 | `[CF-108, FS, 0]` | Side Milestone (`isTerminal: false`) |
| **M-03** | `1.5.1.99` | Substantial Completion & Turnover | Testing & Commissioning | Facility-wide | 0 | `[TC-401, FS, 0]` | Terminal Milestone (`isTerminal: true`) |

---

## 3. 100% Bidirectional Reciprocity Matrix

Every predecessor entry is symmetrically inverted by the engine to generate reciprocal successors:

| Activity ID | Authoritative Predecessors | Reciprocal Successors (Engine-Derived) |
| :--- | :--- | :--- |
| **CF-101** | *None* | `[CF-104, FS, 0]`, `[MP-301, FS, 6]`, `[EI-310, FS, 2]` |
| **CF-104** | `[CF-101, FS, 0]` | `[CF-105, SS, 4]`, `[CF-108, FS, 0]` |
| **CF-105** | `[CF-104, SS, 4]` | `[CF-108, FS, 0]` |
| **CF-108** | `[CF-104, FS, 0]`, `[CF-105, FS, 0]` | `[CS-201, FS, 0]`, `[MF-218, FS, 0]`, `[MP-305, FS, 0]`, `[M-01, FS, 0]` |
| **CS-201** | `[CF-108, FS, 0]` | `[TC-401, FS, 0]` |
| **MF-218** | `[CF-108, FS, 0]` | `[TC-401, FS, 0]` |
| **MP-301** | `[CF-101, FS, 6]` | `[MP-305, FS, 2]` |
| **MP-305** | `[CF-108, FS, 0]`, `[MP-301, FS, 2]` | `[TC-401, FS, 0]` |
| **EI-310** | `[CF-101, FS, 2]` | `[EI-312, FS, 0]` |
| **EI-312** | `[EI-310, FS, 0]` | `[IN-320, FS, 0]` |
| **IN-320** | `[EI-312, FS, 0]` | `[TC-401, FS, 0]` |
| **TC-401** | `[CS-201, FS, 0]`, `[MF-218, FS, 0]`, `[MP-305, FS, 0]`, `[IN-320, FS, 0]` | `[M-03, FS, 0]` |
| **M-01** | `[CF-108, FS, 0]` | *None (Non-Terminal Side Milestone)* |
| **M-03** | `[TC-401, FS, 0]` | *None (Sole Terminal Finish Milestone)* |

---

## 4. Calculated CPM Outputs (Forward & Backward Pass Results)

### Recalculation of Backward Pass (Decoupling M-01)
- **Project Terminal Finish Anchor**: $\text{LF}_{M\text{-}03} = 30$, $\text{LS}_{M\text{-}03} = 30 \implies \text{Total Float} = 0$.
- **Non-Terminal Side Milestone**: $\text{LF}_{M\text{-}01} = 30$, $\text{LS}_{M\text{-}01} = 30 \implies \text{Total Float} = 30 - 21 = \mathbf{+9}$.
- **Backward Pass Constraints on CF-108**:
  `CF-108` has four successors:
  1. `CS-201` ($\text{LS} = 22$, FS 0): $\text{LateBoundary} = 22 - 1 - 0 = \mathbf{21}$ (**DRIVING**)
  2. `MF-218` ($\text{LS} = 24$, FS 0): $\text{LateBoundary} = 24 - 1 - 0 = 23$
  3. `MP-305` ($\text{LS} = 23$, FS 0): $\text{LateBoundary} = 23 - 1 - 0 = 22$
  4. `M-01` ($\text{LS} = 30$, FS 0): $\text{LateBoundary} = 30 - 1 - 0 = 29$
  $$\text{LF}_{\text{CF-108}} = \min(21, 23, 22, 29) = \mathbf{21}$$
  $$\text{LS}_{\text{CF-108}} = 21 - 6 + 1 = \mathbf{16}$$
  $$\text{Total Float}_{\text{CF-108}} = \text{LF} - \text{EF} = 21 - 21 = \mathbf{0}$$

`CF-108` remains strictly zero-float through the physical driving chain to project completion, and receives no artificial constraint or negative float from `M-01`.

| Node ID | Type | Dur | Calculated ES | Calculated EF | Calculated LS | Calculated LF | Total Float | Free Float | Critical? | Role / Notes |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **CF-101** | Activity | 5 | 1 | 5 | 1 | 5 | **0** | 0 | **YES** | Baseline Critical Path Start |
| **CF-104** | Activity | 10 | 6 | 15 | 6 | 15 | **0** | 0 | **YES** | Active Driving Critical Path |
| **CF-105** | Activity | 4 | 10 | 13 | 12 | 15 | **+2** | 2 | No | Rebar Pre-assembly Sub-branch |
| **CF-108** | Activity | 6 | 16 | 21 | 16 | 21 | **0** | 0 | **YES** | Active Driving Critical Path |
| **CS-201** | Activity | 6 | 22 | 27 | 22 | 27 | **0** | 0 | **YES** | Active Driving Critical Path |
| **MF-218** | Activity | 4 | 22 | 25 | 24 | 27 | **+2** | 2 | No | Mechanical Sub-branch |
| **MP-301** | Activity | 8 | 12 | 19 | 13 | 20 | **+1** | 0 | No | Piping Fab Sub-branch |
| **MP-305** | Activity | 5 | 22 | 26 | 23 | 27 | **+1** | 1 | No | Piping Placement Sub-branch |
| **EI-310** | Activity | 6 | 8 | 13 | 10 | 15 | **+2** | 0 | No | Electrical Trenching Sub-branch |
| **EI-312** | Activity | 7 | 14 | 20 | 16 | 22 | **+2** | 0 | No | Cabling Sub-branch |
| **IN-320** | Activity | 5 | 21 | 25 | 23 | 27 | **+2** | 2 | No | Instrumentation Sub-branch |
| **TC-401** | Activity | 2 | 28 | 29 | 28 | 29 | **0** | 0 | **YES** | Active Driving Critical Path |
| **M-01** | Side Milestone | 0 | 21 | 21 | 30 | 30 | **+9** | 9 | No | Non-Terminal Side Handover Milestone |
| **M-03** | Terminal Milestone | 0 | 30 | 30 | 30 | 30 | **0** | 0 | **YES** | Project Terminal Finish Anchor |

### Resulting Mathematically Derived Critical Paths:
1. **Full Baseline Project Critical Path** (activities where $\text{totalFloat} = 0$ driving the project finish):
   $$\mathbf{CF\text{-}101 \rightarrow CF\text{-}104 \rightarrow CF\text{-}108 \rightarrow CS\text{-}201 \rightarrow TC\text{-}401 \rightarrow M\text{-}03}$$
2. **Active Remaining Critical Path** (at Day 14 status date, where `CF-101` is completed):
   $$\mathbf{CF\text{-}104 \rightarrow CF\text{-}108 \rightarrow CS\text{-}201 \rightarrow TC\text{-}401 \rightarrow M\text{-}03}$$

---

## 5. Scope of Code Changes (Minimally Invasive)

### `src/data/alphaFacilityData.js` (NEW)
- Holds authoritative raw schedule parameters (durations, predecessors, lags, `isTerminal`).
- Implements pure topological CPM engine (`calculateCPM(rawActivities)`):
  - Inverts predecessors to derive reciprocal `successors` bidirectionally.
  - Forward pass calculating inclusive early dates (`ES`, `EF`).
  - Backward pass:
    - Anchors project terminal late date strictly on `isTerminal: true` node (`M-03`, $\text{LF} = 30$).
    - Any non-terminal milestone without successors (`M-01`) inherits project finish ($\text{LF} = 30, \text{LS} = 30$), yielding positive side milestone float.
    - Propagates late dates backward across all predecessor relationships.
  - Computes `totalFloat = LS - ES`, `freeFloat`, and `isCritical = (totalFloat === 0 && ES === LS)`.
  - Derives `getCriticalPath()` by tracing zero-float driving predecessors from terminal milestone `M-03`.
- Exports `validateScheduleTopology()` asserting 100% bidirectional reciprocity.
- Exports query accessors: `getProjectSummary()`, `getAllActivities()`, `getCriticalPath()`, `getActiveCriticalPath(currentDay)`, `getActivityById(id)`.

### `src/App.jsx` (MINIMALLY INVASIVE)
- **Zero Structural / Styling Changes**: Preserves all existing views (`Overview`, `Intelligence`, `Impact`, `Recovery`, `DomainSupervisor`, `UpdatedState`), CSS classes, and DOM trees.
- **1-Click Persona Login**: Adds direct login buttons on `LoginView`:
  - `[Login as Project Manager · Ravi Mehta]` ➔ sets `userRole = "manager"`, opens `overview`.
  - `[Login as Domain Supervisor · Arjun Sharma]` ➔ sets `userRole = "domain"`, opens `domain`.
- **Role Navigation Normalization**: Ensures `manager` sees Manager navigation items and `domain` sees Supervisor navigation items.
- **Data Consumption**: Sources project summary statistics (14 nodes, Day 14 date, active critical chain) from `alphaFacilityData.js`.

---

## 6. Precise Acceptance & Verification Criteria

1. **Pure Calculation & Zero Hardcoding Assertion**:
   - `totalFloat`, `earlyStart`, `earlyFinish`, `lateStart`, `lateFinish`, and `isCritical` are purely computed by `calculateCPM()`.
   - Zero hardcoded boolean flags or manual float overrides exist in the dataset or CPM engine.

2. **Driving Critical Path Chain Assertion**:
   - Programmatic assertion that `getCriticalPath()` strictly yields:  
     `["CF-101", "CF-104", "CF-108", "CS-201", "TC-401", "M-03"]`
   - Programmatic assertion that `getActiveCriticalPath(14)` strictly yields:  
     `["CF-104", "CF-108", "CS-201", "TC-401", "M-03"]`
   - Every node on the critical path strictly satisfies `totalFloat === 0` and `isCritical === true`.

3. **Activity Criticality & Positive Float Assertion**:
   - For all **activities** (nodes where `type === 'activity'` / duration $D \ge 1$):
     - Every non-critical activity (`CF-105`, `MF-218`, `MP-301`, `MP-305`, `EI-310`, `EI-312`, `IN-320`) must have calculated $\text{totalFloat} > 0$ and $\text{isCritical} === false$.
     - Formal assertion:
       ```js
       activities
         .filter(a => a.type === 'activity' && !a.isCritical)
         .every(a => a.totalFloat > 0) === true
       ```

4. **Milestone Float Semantics Assertion**:
   - **Terminal Milestone (`M-03`)**: Anchors project finish at Day 30 (`isTerminal: true`), with $\text{totalFloat} = 0$ and $\text{isCritical} = \text{true}$.
   - **Non-Terminal Side Milestone (`M-01`)**: Has explicitly defined side milestone float semantics (`isTerminal: false`):
     - Receives project finish late boundary ($\text{LF} = 30, \text{LS} = 30$).
     - Has calculated $\text{totalFloat} = 30 - 21 = \mathbf{+9 > 0}$ and $\text{isCritical} = \text{false}$.
     - Does **not** constrain `CF-108`'s backward pass or create negative float on `CF-108`.
     - Excluded from the activity criticality check and verified under dedicated milestone float rules.

5. **Bidirectional Reciprocity Assertion**:
   - `validateScheduleTopology()` passes with `valid: true` and 0 unreciprocated links across all 14 nodes.

6. **Build & Code Quality**:
   - `npm run build` exits code 0 with no bundling or PostCSS errors.
   - `npx oxlint` exits code 0 with zero errors and zero warnings.
