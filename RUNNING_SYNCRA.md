# Running SYNCRA from GitHub

This guide provides end-to-end instructions for cloning, setting up, running, and testing **SYNCRA** (Autonomous Construction & Capital Projects Schedule Intelligence & Recovery Decision Platform) directly from GitHub.

---

## 1. Prerequisites

Ensure the following tools are installed on your machine:

- **Node.js**: Version `18.0.0` or higher (Node `20.x` or `22.x` recommended)
  - Verify with: `node -v`
- **npm**: Version `9.0.0` or higher
  - Verify with: `npm -v`
- **Git**:
  - Verify with: `git --version`
- **Modern Web Browser**: Chrome, Edge, Firefox, or Safari

---

## 2. Clone the Repository

Clone the repository from GitHub to your local machine:

```bash
git clone https://github.com/hussainsiyahi18/SYNCRA-v1.git
cd SYNCRA-v1
```

---

## 3. Install Dependencies

Install the required npm packages:

```bash
npm install
```

---

## 4. Run the Application Locally

Start the Vite development server:

```bash
npm run dev
```

Once started, Vite will output the local server URL (typically `http://localhost:5173/`):

```text
  VITE v8.3.0  ready in 400 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open **`http://localhost:5173/`** in your browser.

---

## 5. User Roles & Login Workflows

When the application loads, you can skip the intro sequence by clicking **"Skip Intro"** or letting it initialize.

On the sign-in screen, you can use the **One-Click Quick Login** buttons:

| Role | Quick Login Button | Description |
| :--- | :--- | :--- |
| **Project Manager** | `Quick Fill: Project Manager` | Full executive visibility: portfolio directory, schedule slippage analysis, critical chain tracking, recovery decisions approval, and baseline management. |
| **Domain Supervisor** | `Quick Fill: Domain Supervisor` | Field supervisor interface: mobile workfront reporting, natural language observation logging, GPS telemetry corroboration, and dual-score automation gate inspection. |

---

## 6. Navigating SYNCRA Views

### A. Capital Projects Directory (Multi-Project Selection)
- **Alpha Facility Phase 2**: Complex petrochemical complex with active CPM simulation sandbox, critical path slippage (+3d), and decision recovery workflows.
- **Thar Solar Complex Package 4**: High-capacity solar EPC project (Bikaner, Rajasthan), operating nominally with independent WBS activities.

### B. Project Manager Views
1. **Overview Dashboard**: High-level health indicators, Day 14 status date, active site condition attention items, and baseline vs. forecast timeline comparison.
2. **Execution & Impact**: Interactive topological CPM visualization showing the disturbed activity (`CF-104`), downstream driving chain (`CF-108 → CS-201 → TC-401 → M-03`), and zero-float propagation.
3. **Recovery Decisions**: Decision engine proposing 3 actionable recovery alternatives (Plan A: Resequence work, Plan B: Shift resources, Plan C: Accept variance) with trade-off analysis.
4. **Intelligence**: Ingests field telemetry and highlights verified activity status, float buffer health, and downstream impact prediction.
5. **Updated Schedule**: Living CPM 14-node schedule variance matrix comparing Baseline EF, Forecast EF, and Float Delta.

### C. Simulation Sandbox (Alpha Facility)
Switch between 3 pre-configured scenarios using the top scenario drawer:
- **Scenario 1: CF-104 Boulder Blockage (+3d)**: Critical path delay propagating to terminal milestone M-03 (Day 30 slips to Day 33).
- **Scenario 2: MP-301 Laydown Delay (+1d)**: Disruption absorbed within 1 day of available total float; project finish preserved at Day 30.
- **Scenario 3: Ambiguous Civil Log (CF-104 vs CF-105)**: Close candidate confidence margin (+4 pp vs +15 pp threshold); automatically routed to the Human Review Queue.

---

## 7. Running Verification & Test Suites

SYNCRA includes automated test suites covering topological CPM mathematics, context isolation, and transition cycles:

```bash
# 1. Run Topological CPM math verification
node test/cpmVerification.js

# 2. Run Multi-Project context & data isolation tests
node test/projectContextVerification.js

# 3. Run Phase 2 closed-loop scenarios verification
node test/phase2Verification.js

# 4. Run Complete project transition cycle test (Alpha -> Rajasthan -> Alpha)
node test/transitionCycleVerification.js
```

### Run All Tests in One Command:
```bash
node test/cpmVerification.js && node test/projectContextVerification.js && node test/phase2Verification.js && node test/transitionCycleVerification.js
```

### Code Quality & Build Checks:
```bash
# Run Oxlint
npx oxlint

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 8. Technology Stack

- **Framework**: React 19 + Vite
- **Styling**: Vanilla CSS (Enterprise Dark Theme with semantic token system)
- **Engines**: Custom Topological Critical Path Method (CPM) Engine, Forward/Backward Float Calculator, and Dual-Score Automation Gate Rule Evaluator.
- **Linter**: Oxlint
