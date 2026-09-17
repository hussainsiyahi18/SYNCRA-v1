# Codebase Architecture Map: SYNCRA v1

**Generated**: 2026-09-17  
**Repository**: `syncra-v1`  
**Purpose**: Spec-driven architecture map produced via `/gsd-map-codebase`

---

## 1. Executive Summary

**SYNCRA** is an **Execution Intelligence** platform for complex capital projects (industrial, EPC, and civil infrastructure). The application bridges the operational gap between **Field Execution** (supervisors reporting daily ground reality) and **Project Management** (managers managing schedule risks, milestone float, and recovery plans).

The system models field events, calculates schedule network exposure (identifying float erosion before milestone failure), and generates actionable recovery strategies for manager approval while preserving historical actuals and approved baselines.

---

## 2. Technology Stack & Tooling

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **UI Framework** | React 19 (`^19.2.8`) | Modern hooks (`useState`, `useEffect`), strict mode |
| **Bundler & Dev Server** | Vite 8 (`^8.3.0`) | ESM-native HMR, `@vitejs/plugin-react` |
| **Type Support** | React Type Definitions | `@types/react` (`^19.2.18`), `@types/react-dom` (`^19.2.7`) |
| **Linter** | Oxlint (`^1.81.0`) | High-speed Rust linter with React rules configured |
| **Styling** | Pure Vanilla CSS | Custom design token system in `App.css` (~118 KB, 6.9k lines) |
| **Fonts** | Google Fonts | `EB Garamond` (editorial display) & `Inter` (UI sans) |
| **Event Bus** | `BroadcastChannel` API | Cross-tab / cross-view real-time messaging on `"syncra-project-events"` |

---

## 3. Directory & File Inventory

```
syncra-v1/
├── index.html               # SPA HTML container with root div and favicon links
├── package.json             # Scripts: dev, build, lint, preview
├── vite.config.js           # Vite configuration with React plugin
├── .oxlintrc.json           # Oxlint rules (rules-of-hooks, only-export-components)
├── .gitignore               # Standard git exclusions (node_modules, dist)
├── public/
│   ├── favicon.svg          # Syncra brand favicon
│   └── icons.svg            # SVG icon sheet
├── src/
│   ├── main.jsx             # React 19 entrypoint mounting <App /> into #root
│   ├── index.css            # Base box-sizing, typography, background reset
│   ├── App.jsx              # Monolithic application component containing all views (2,439 lines)
│   ├── App.css              # Monolithic design system and component styles (6,960 lines)
│   └── assets/
│       ├── hero.png         # Facility imagery asset
│       ├── react.svg        # React logo
│       └── vite.svg         # Vite logo
└── .planning/
    ├── CODEBASE.md          # This codebase map
    ├── PROJECT.md           # Product requirements & architecture specification
    ├── ROADMAP.md           # Phased evolution roadmap
    └── STATE.md             # Execution state tracking
```

---

## 4. Architecture & Component Hierarchy

Currently, all application logic and subviews are co-located within [`src/App.jsx`](file:///c:/Users/hp/syncra-v1/src/App.jsx):

```mermaid
graph TD
    Root[main.jsx] --> AppShell[App.jsx]
    AppShell --> Intro[SyncraIntro (5.2s auto-timer)]
    AppShell --> Login[LoginView]
    AppShell --> Shell[App Layout]
    
    Shell --> Sidebar[Sidebar & Project Nav]
    Shell --> Topbar[Topbar & Breadcrumbs]
    Shell --> MainContent[Dynamic Views]
    
    MainContent --> Overview[Overview View]
    MainContent --> Domain[DomainSupervisorView]
    MainContent --> Intel[IntelligenceView]
    MainContent --> Impact[ImpactView]
    MainContent --> Recovery[RecoveryView]
    MainContent --> Updated[UpdatedStateView]
    
    Domain -. "BroadcastChannel: syncra-project-events" .-> Intel
```

### Component Details

| Component | Lines (approx.) | Purpose & Responsibilities |
| :--- | :--- | :--- |
| `App` | `1-395` | Top-level state coordinator: view routing (`overview`, `intelligence`, `impact`, `recovery`, `domain`, `updated`), user role session, broadcast channel publisher/subscriber. |
| `SyncraIntro` | `396-487` | Cinematic onboarding splash screen with progressive branding and timer-based auto-dismissal. |
| `LoginView` | `488-615` | Role-based credential authentication for Manager and Domain Supervisor personas. |
| `IntelligenceView` | `616-1144` | Listens for incoming field events; displays live animated reception overlay, AI confidence metrics, signal details, and baseline comparison. |
| `ImpactView` | `1145-1295` | Traces verified events through the critical path network: node dependency chain (`CF-104` ➔ `MF-218`), float consumption, and risk severity. |
| `RecoveryView` | `1296-1505` | Generates 3 tactical recovery alternatives (Plan A: Resequence work, Plan B: Shift resources, Plan C: Accept variance); enables manager approval. |
| `DomainSupervisorView` | `1506-2249` | Field supervisor data entry form for daily progress reports, issue logging, photo evidence attachment, and 5-step simulation pipeline. |
| `UpdatedStateView` | `2250-2439` | Confirmation view verifying that approved recovery action was incorporated into working schedule while keeping approved baseline intact. |

---

## 5. Personas & Authentication

Authentication is handled locally in `LoginView` via `MOCK_USERS`:

| User ID | Password | Role | Default Landing View | Persona Scope |
| :--- | :--- | :--- | :--- | :--- |
| `manager01` | `syncra123` | `manager` | `overview` | Ravi Mehta — Project Manager. Full oversight of project forecast, network exposure, and recovery decisions. |
| `domain01` | `syncra123` | `domain` | `domain` | Arjun Sharma — Domain Supervisor. Ground-level reporting, daily field observations, and activity verification. |

---

## 6. Real-Time Inter-Process Communication

Syncra utilizes the native browser **`BroadcastChannel`** interface on the channel name **`syncra-project-events`**:

1. **Publisher (`DomainSupervisorView`)**:
   - When supervisor submits a daily report, a multi-step processing animation executes.
   - At step 5 (3.9s), `onPublish(event)` dispatches an `EXECUTION_EVENT` across the channel.
2. **Subscriber (`App` / `IntelligenceView`)**:
   - `App` mounts a persistent channel listener in `useEffect`.
   - Incoming payloads trigger `setExecutionEvent` and `setIncomingEvent`.
   - `IntelligenceView` transitions from idle "Listening" state to "New field reality detected" live alert.

---

## 7. Key Findings & Technical Debt

### High Priority
1. **Sidebar Role Navigation Mismatch**:
   - In [`src/App.jsx` line 84](file:///c:/Users/hp/syncra-v1/src/App.jsx#L84), navigation items are gated by `{userRole === "Manager" ? ... : ...}`.
   - However, [`LoginView` line 496](file:///c:/Users/hp/syncra-v1/src/App.jsx#L496) sets `role: "manager"` (lowercase).
   - *Impact*: Logging in as Manager currently shows the Domain Supervisor navigation links ("Daily Reports", "Verified Events") instead of Manager navigation ("Overview", "Execution", "Schedule", etc.).
2. **Monolithic Single-File Structure**:
   - `App.jsx` is 2,439 lines; `App.css` is 6,960 lines.
   - All state, views, models, and mock data reside in these two files, limiting maintainability, code reuse, and testability.

### Medium Priority
3. **Hardcoded State & Event Flow**:
   - The event pipeline is currently locked to Activity `CF-104` (Foundation Excavation at Grid A-14).
   - Generalizing event payload schemas would allow arbitrary activity tracking and dynamic impact calculation.
4. **Navigation State Duplication**:
   - View switching relies on manual `setView(...)` callbacks rather than a structured router (e.g., hash routing or lightweight router), making direct linking or browser back/forward non-functional.
