# SYNCRA — Autonomous Construction & Capital Projects Schedule Intelligence Platform

> **Real-time field reality dynamically bridged with living CPM critical paths and decision recovery intelligence.**

SYNCRA is an enterprise capital projects decision-support system designed to detect workfront disturbances, propagate deterministic CPM network delays, evaluate deterministic veto checks, and propose optimized schedule recovery plans for mega-infrastructure and industrial projects.

---

## 🚀 Quick Start: Running SYNCRA Locally

### 1. Clone the Repository
```bash
git clone https://github.com/hussainsiyahi18/SYNCRA-v1.git
cd SYNCRA-v1
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Local Development Server
```bash
npm run dev
```

Open **`http://localhost:5173/`** in your browser.

> For a complete guide on workflows, test suites, and project architecture, see **[RUNNING_SYNCRA.md](./RUNNING_SYNCRA.md)**.

---

## 📋 Core Capabilities

- **Multi-Project Enterprise Workspace**: Seamlessly switch between diverse industrial complexes:
  - **Alpha Facility Phase 2**: Complex petrochemical complex (Assam) featuring 14 WBS activities, dynamic CPM simulation sandbox, and schedule recovery decision workflows.
  - **Thar Solar Complex Package 4**: Mega-scale utility solar array (Rajasthan) with independent workfronts and nominal operating status.
- **Topological Critical Path Method (CPM) Engine**: Full topological sort, forward/backward pass calculation, early start/finish, late start/finish, total float, and free float computation.
- **Dynamic Disturbance & Float Erosion Propagation**: Real-time evaluation of how individual workfront bottlenecks propagate along driving critical chains to terminal completion milestones.
- **Dual-Score Automation Gate (Part V § 31)**: Multi-attribute confidence assessment combining candidate identity scoring with living CPM schedule context matching.
- **Deterministic Hard-Check Vetoes**: Geofence GPS telemetry, equipment roster consistency, predecessor handover verification, and photo evidence corroboration.
- **Schedule Recovery Intelligence**: Evaluates trade-offs across multiple recovery alternatives (Resequence work, Shift resources, Accept variance) with cost, resource load, and finish protection metrics.
- **Standardized Attention-Critical Signal Semantics**:
  - 🔴 **Red**: Warnings, critical path blockages, direct project delays, 0-day float on critical chains, and immediate decision requirements.
  - 🟡 **Amber**: Float buffer absorption, non-critical buffer erosion, cautionary alerts, and human review routing.
  - 🟢 **Green**: Preserved milestones, nominal conditions, and verified passes.
  - 🔵 **Blue**: Neutral system navigation, interactive elements, and baseline markers.

---

## 🧪 Automated Verification & Test Suite

Verify all mathematical engines, data isolation rules, and multi-project lifecycle switches:

```bash
# Run the complete test suite
node test/cpmVerification.js
node test/projectContextVerification.js
node test/phase2Verification.js
node test/transitionCycleVerification.js
```

### Linting & Production Build
```bash
# Code linting
npx oxlint

# Production build
npm run build
```

---

## 👥 User Roles & Walkthrough

| Role | Interface Highlights | Primary Responsibilities |
| :--- | :--- | :--- |
| **Project Manager (PM)** | Enterprise Directory, Project Overview, Critical Path & Float Impact, Recovery Options, Living Schedule Table | Executive baseline control, approving schedule revisions, evaluating recovery tradeoffs. |
| **Domain Supervisor** | Workfront Observation Ingest, Audio/Text Logging, Telemetry Verification, Dual-Score Gate Inspection | Logging daily workfront progress, reporting site constraints, attaching GPS/photographic corroboration. |

*Quick login buttons are available directly on the login screen for rapid evaluation.*

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: Vanilla CSS (Tailored Dark Theme, CSS Tokens, Responsive Layouts)
- **Math & Logic**: Native JavaScript ES Modules (Topological CPM, Perturbation Engine, Confidence Gate)
- **Quality**: Oxlint

---

## 📄 License

Proprietary and Confidential — SYNCRA Platform Architecture.
