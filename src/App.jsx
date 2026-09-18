import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { simulateSchedulePerturbation } from "./data/scheduleSimulation";
import { evaluateFieldSignal } from "./data/confidenceEngine";
import { getScenarioById } from "./data/demoScenarios";
import {
  getAllProjects,
  getProjectById,
  getProjectScheduleState,
  DEFAULT_PROJECT_ID
} from "./data/projectsRegistry";

function App() {
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [view, setView] = useState("overview");
  const [showIntro, setShowIntro] = useState(true);
  const [activeScenarioId, setActiveScenarioId] = useState("cf104-blockage");

  const currentProject = getProjectById(selectedProjectId) || getProjectById(DEFAULT_PROJECT_ID);

  const currentPerturbation = getProjectScheduleState(
    currentProject,
    activeScenarioId,
    simulateSchedulePerturbation,
    getScenarioById
  );

  const createEventFromScenario = useCallback((sc, ev, prj) => {
    if (!sc || !ev) {
      const activeProject = prj || currentProject;
      const actId = activeProject?.activities?.[2]?.id || "SP-204";
      const actName = activeProject?.activities?.[2]?.name || "PV Module Stringing & Cabling";
      const discipline = activeProject?.activities?.[2]?.discipline || "Solar EPC";
      const workfront = activeProject?.supervisor?.assignedWorkfront || "Block C-08 · Inverter Yard";
      const statusDate = activeProject?.statusDate || "Day 42 · Shift A";

      return {
        id: "EV-GENERIC",
        activity: actId,
        activityName: actName,
        location: workfront,
        discipline: discipline,
        workfront: workfront,
        state: "In Progress",
        progress: "46%",
        date: statusDate,
        time: "10:30",
        confidence: 96,
        margin: 25,
        contextMatch: 95,
        evidence: "3 field photographs",
        issue: "Standard daily production tracking",
        gateRouting: "AUTO-ACCEPT",
        isAutoAccept: true,
        gateExplanation: "Progress consistent with schedule plan",
        topCandidate: `${actId} (${actName})`,
        secondCandidate: activeProject?.activities?.[3]?.id ? `${activeProject.activities[3].id} (${activeProject.activities[3].name})` : "Secondary Workfront",
        hardChecks: "PASS"
      };
    }

    return {
      id: sc.id === "cf104-blockage" ? "EV-014" : sc.id === "mp301-delay" ? "EV-015" : "EV-016",
      activity: sc.activityId,
      activityName: sc.activityName,
      location: sc.workfront,
      discipline: sc.discipline,
      workfront: sc.workfront,
      state: sc.newStatus,
      progress: `${sc.quantityProgress}%`,
      date: "Day 14",
      time: "16:42",
      confidence: ev.confidence,
      margin: ev.margin,
      contextMatch: ev.contextMatch,
      evidence: `${sc.evidenceCount} field photographs`,
      issue: sc.reason,
      gateRouting: ev.gateRouting,
      isAutoAccept: ev.isAutoAccept,
      gateExplanation: ev.gateExplanation,
      topCandidate: `${ev.topCandidate?.id || sc.activityId} (${ev.topCandidate?.name || sc.activityName})`,
      secondCandidate: `${ev.secondCandidate?.id || ""} (${ev.secondCandidate?.name || ""})`,
      hardChecks: ev.hardChecks
    };
  }, [currentProject]);

  const [executionEvent, setExecutionEvent] = useState(() => {
    const sc = getScenarioById("cf104-blockage");
    const ev = evaluateFieldSignal({ scenarioKey: "cf104-blockage" });
    return createEventFromScenario(sc, ev, getProjectById(DEFAULT_PROJECT_ID));
  });
  const [incomingEvent, setIncomingEvent] = useState(null);

  const handleScenarioChange = useCallback((newId) => {
    setActiveScenarioId(newId);
    const sc = getScenarioById(newId);
    if (sc) {
      const ev = evaluateFieldSignal({ scenarioKey: newId });
      setExecutionEvent(createEventFromScenario(sc, ev, currentProject));
    }
  }, [createEventFromScenario, currentProject]);

  const handleSelectProject = (projectId) => {
    const prj = getProjectById(projectId);
    if (!prj) return;
    setSelectedProjectId(prj.id);

    if (prj.capabilities.hasSimulationSandbox) {
      const defaultSc = prj.defaultScenarioId || "cf104-blockage";
      setActiveScenarioId(defaultSc);
      const sc = getScenarioById(defaultSc);
      if (sc) {
        const ev = evaluateFieldSignal({ scenarioKey: defaultSc });
        setExecutionEvent(createEventFromScenario(sc, ev, prj));
      }
    } else {
      setActiveScenarioId(null);
      setExecutionEvent(createEventFromScenario(null, null, prj));
    }

    if (userRole === "domain") {
      setView("domain");
    } else {
      setView("overview");
    }
  };

  useEffect(() => {
    const channel = new BroadcastChannel("syncra-project-events");

    channel.onmessage = (event) => {
      if (event.data?.type === "EXECUTION_EVENT") {
        setExecutionEvent(event.data.payload);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  const publishExecutionEvent = (event) => {
    setExecutionEvent(event);
    setIncomingEvent(event);

    const channel = new BroadcastChannel("syncra-project-events");

    channel.postMessage({
      type: "EXECUTION_EVENT",
      payload: event,
    });

    channel.close();

    setTimeout(() => {
      setIncomingEvent(null);
    }, 4200);
  };

  if (showIntro) {
    return <SyncraIntro onComplete={() => setShowIntro(false)} />;
  }

  if (!userRole) {
    return (
      <LoginView
        onLogin={(role, userObj) => {
          const normalizedRole = (role || "").trim().toLowerCase();
          setUserRole(normalizedRole);
          setCurrentUser(userObj || {
            id: normalizedRole === "domain" ? "domain01" : "manager01",
            name: normalizedRole === "domain" ? "Arjun Sharma" : "Ravi Mehta",
            role: normalizedRole,
            roleTitle: normalizedRole === "domain" ? "Lead Domain Supervisor" : "Project Manager"
          });
          setSelectedProjectId(null);
        }}
      />
    );
  }

  if (!selectedProjectId) {
    return (
      <WorkspaceDirectoryView
        user={currentUser}
        onSelectProject={handleSelectProject}
        onLogout={() => {
          setUserRole(null);
          setCurrentUser(null);
          setSelectedProjectId(null);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <div className="brand-name">SYNCRA</div>
            <div className="brand-subtitle">Execution Intelligence</div>
          </div>
        </div>

        {/* ACTIVE PROJECT CONTEXT SWITCHER */}
        <div className="project-switcher sidebar-project-badge">
          <div className="eyebrow badge-kicker">PROJECT CONTEXT</div>
          <div className="project-name badge-project-name">{currentProject.name}</div>
          <div className="project-meta badge-project-loc">{currentProject.location} · {currentProject.statusDate}</div>
          <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
            <select
              id="project-switcher-select"
              className="project-switcher-select"
              value={currentProject.id}
              onChange={(e) => handleSelectProject(e.target.value)}
              title="Switch Active Capital Project"
              style={{
                flex: 1,
                background: "rgba(10, 15, 26, 0.85)",
                color: "#e2e8f0",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "6px",
                padding: "4px 6px",
                fontSize: "11px",
                cursor: "pointer"
              }}
            >
              {getAllProjects().map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.location.split(",")[0]})
                </option>
              ))}
            </select>
            <button
              id="btn-sidebar-switch-project"
              type="button"
              className="sidebar-switch-btn"
              onClick={() => setSelectedProjectId(null)}
              title="Return to Workspace Project Directory"
              style={{ whiteSpace: "nowrap" }}
            >
              ⇄ Workspace
            </button>
          </div>
        </div>

        <nav className="navigation">

  <div className="nav-section-label">
    {userRole === "domain" ? "FIELD EXECUTION" : "PROJECT"}
  </div>

  {(userRole || "").toLowerCase() === "manager" ? (
    <>
      <button
        className={`nav-item ${view === "overview" ? "active" : ""}`}
        onClick={() => setView("overview")}
        type="button"
      >
        <span className="nav-icon">◉</span>
        Overview
      </button>

      <button
        className={`nav-item ${view === "impact" ? "active" : ""}`}
        onClick={() => setView("impact")}
        type="button"
      >
        <span className="nav-icon">↗</span>
        Execution & Impact
      </button>

      <button
        className={`nav-item ${view === "recovery" ? "active" : ""}`}
        onClick={() => setView("recovery")}
        type="button"
      >
        <span className="nav-icon">⌁</span>
        Recovery Decisions
      </button>

      <button
        className={`nav-item ${view === "intelligence" ? "active" : ""}`}
        onClick={() => setView("intelligence")}
        type="button"
      >
        <span className="nav-icon">✦</span>
        Intelligence
      </button>

      <button
        className={`nav-item ${view === "updated" ? "active" : ""}`}
        onClick={() => setView("updated")}
        type="button"
      >
        <span className="nav-icon">△</span>
        Updated Schedule
      </button>
    </>
  ) : (
    <>
      <button
        className={`nav-item ${view === "domain" ? "active" : ""}`}
        onClick={() => setView("domain")}
        type="button"
      >
        <span className="nav-icon">▤</span>
        Daily Reports
      </button>

      <button
        className={`nav-item ${view === "intelligence" ? "active" : ""}`}
        onClick={() => setView("intelligence")}
        type="button"
      >
        <span className="nav-icon">✓</span>
        Verified Events
      </button>

      <button
        className={`nav-item ${view === "updated" ? "active" : ""}`}
        onClick={() => setView("updated")}
        type="button"
      >
        <span className="nav-icon">△</span>
        Readiness
      </button>
    </>
  )}

  <div className="nav-section-label secondary-label">
    SYSTEM
  </div>

  <button className="nav-item">
    <span className="nav-icon">◌</span>
    History
  </button>

  <button className="nav-item">
    <span className="nav-icon">⚙</span>
    Settings
  </button>

</nav>

        <div className="sidebar-footer">
          <div className="user-avatar">
  {userRole === "domain" ? "DS" : "RM"}
</div>

<div className="user-info">
  <div className="user-name">
    {userRole === "domain"
      ? "Arjun Sharma"
      : "Ravi Mehta"}
  </div>

  <div className="user-role">
    {userRole === "domain"
      ? "Domain Supervisor"
      : "Project Manager"}
  </div>
</div>
<button
  className="logout-button"
  type="button"
  onClick={() => {
    setUserRole(null);
    setCurrentUser(null);
    setSelectedProjectId(null);
    setView("overview");
  }}
>
  Sign out
</button>
        </div>
        
      </aside>

      <header className="topbar">
        <div>
          <div className="breadcrumb">
            <button
              type="button"
              className="breadcrumb-root-btn"
              onClick={() => setSelectedProjectId(null)}
              title="Return to Workspace Project Directory"
            >
              Projects
            </button>
            <span className="breadcrumb-separator">/</span>
            <strong>{currentProject.name}</strong>
            <span className="breadcrumb-location">({currentProject.location})</span>
          </div>
          <h1>
            {view === "overview"
              ? "Project Overview"
              : view === "intelligence"
              ? "SYNCRA Intelligence"
              : view === "impact"
              ? "Impact Analysis"
              : view === "recovery"
              ? "Recovery Intelligence"
              : view === "domain"
              ? "Domain Supervisor"
              : "Updated Project State"}
          </h1>
        </div>

        <div className="topbar-actions">
          <button
            id="btn-switch-project"
            type="button"
            className="topbar-switch-project-btn"
            onClick={() => setSelectedProjectId(null)}
            title="Return to Workspace Project Directory"
          >
            <span>⇄</span> Switch Project
          </button>

          <div className="status-pill">
            <span className="status-dot"></span>
            {currentProject.status}
          </div>

          <button className="notification-button">○</button>
        </div>
      </header>

      {/* SECONDARY DEMO SIMULATION SANDBOX (Scoped exclusively to projects with demo simulation) */}
      {currentProject.capabilities.hasSimulationSandbox ? (
        <div className="demo-simulation-drawer">
          <div className="drawer-header">
            <span className="drawer-demo-tag">SIMULATION SANDBOX</span>
            <strong className="drawer-heading">Inject Execution Disturbance</strong>
            <small className="drawer-sub">Phase 2 Closed-Loop Benchmarks · {currentProject.name}</small>
          </div>

          <div className="drawer-scenario-chips">
            {currentProject.demoScenarios.map((sc) => (
              <button
                key={sc.id}
                type="button"
                className={`drawer-chip ${activeScenarioId === sc.id ? "active" : ""}`}
                onClick={() => handleScenarioChange(sc.id)}
              >
                <span>{sc.badgeType === "danger" ? "⚡" : sc.badgeType === "warning" ? "⏳" : "⚠️"}</span>
                <span className="chip-name">{sc.name}</span>
                <span className="chip-badge">{sc.badge}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="production-status-strip">
          <span className="prod-badge">PRODUCTION RUNTIME</span>
          <span>{currentProject.name} · Operating within standard CPM control thresholds (Baseline Day {currentProject.baselineFinishDay}).</span>
        </div>
      )}

      <main>
      {view === "overview" ? (
        <section className="content">
          <div className="hero-row">
            <div>
              <p className="section-kicker">{currentProject.code} · {currentProject.sector.toUpperCase()}</p>
              <h2>{currentProject.health}</h2>
              <p className="hero-description">
                {currentPerturbation.projectDelayDays > 0
                  ? `SYNCRA has identified critical-path variances affecting ${currentProject.name}. Review intelligence and recovery options.`
                  : `${currentProject.name} is tracking to baseline milestones without critical exposure.`}
              </p>
            </div>

            {currentPerturbation.projectDelayDays > 0 && (
              <button
                className="primary-button"
                onClick={() => setView("intelligence")}
              >
                Review intelligence <span>→</span>
              </button>
            )}
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">PHYSICAL PROGRESS</div>
              <div className="metric-value">{currentProject.summaryStats.physicalProgress}%</div>
              <div className="metric-note positive">{currentProject.summaryStats.progressTrend}</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">CURRENT FORECAST</div>
              <div className="metric-value">
                {currentPerturbation.projectDelayDays > 0 ? `+${currentPerturbation.projectDelayDays} days` : "0 days"}
              </div>
              <div className={`metric-note ${currentPerturbation.projectDelayDays > 0 ? "warning" : "positive"}`}>
                vs Day {currentProject.baselineFinishDay} baseline
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">CRITICAL ACTIVITIES</div>
              <div className="metric-value">{currentProject.summaryStats.activeCriticalCount}</div>
              <div className="metric-note">{currentProject.summaryStats.criticalChainPreview}</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">OPEN DECISIONS</div>
              <div className="metric-value">{currentPerturbation.projectDelayDays > 0 ? 1 : 0}</div>
              <div className="metric-note">
                {currentPerturbation.projectDelayDays > 0 ? "Requires manager authority" : "All paths clear"}
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="panel attention-panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">PROJECT SIGNALS</p>
                  <h3>Active Site Conditions</h3>
                </div>
                <span className="count-badge">{String(currentProject.attentionItems.length).padStart(2, "0")}</span>
              </div>

              {currentProject.attentionItems.map((item) => (
                <div key={item.id} className="attention-item">
                  <div className={`severity ${item.severity}`}></div>
                  <div className="attention-content">
                    <div className="attention-title">{item.title}</div>
                    <div className="attention-description">{item.description}</div>
                    <div className="attention-meta">{item.meta}</div>
                  </div>
                  <span className="arrow">→</span>
                </div>
              ))}
            </section>

            <section className="panel forecast-panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">FORECAST</p>
                  <h3>Project timeline</h3>
                </div>
                <span className="muted-label">{currentProject.statusDate}</span>
              </div>

              <div className="timeline">
                <div className="timeline-row">
                  <span className="timeline-label">Baseline</span>
                  <div className="timeline-track">
                    <div className="timeline-baseline"></div>
                    <span className="timeline-date">Day {currentProject.baselineFinishDay}</span>
                  </div>
                </div>

                <div className="timeline-row">
                  <span className="timeline-label">Forecast</span>
                  <div className="timeline-track">
                    <div className="timeline-forecast"></div>
                    <span className={`timeline-date ${currentPerturbation.projectDelayDays > 0 ? "red-text" : "green-text"}`}>
                      Day {currentProject.baselineFinishDay + currentPerturbation.projectDelayDays}
                    </span>
                  </div>
                </div>
              </div>

              <div className="forecast-summary">
                <div>
                  <span className="summary-label">Variance</span>
                  <strong>{currentPerturbation.projectDelayDays > 0 ? `+${currentPerturbation.projectDelayDays} days` : "0 days"}</strong>
                </div>

                <div>
                  <span className="summary-label">Confidence</span>
                  <strong>{currentPerturbation.projectDelayDays > 0 ? "Verified" : "Nominal"}</strong>
                </div>
              </div>
            </section>
          </div>
        </section>
      ) : view === "intelligence" ? (
        <IntelligenceView
          executionEvent={executionEvent}
          incomingEvent={incomingEvent}
          project={currentProject}
          perturbationResult={currentPerturbation}
          onBack={() => setView("overview")}
          onImpact={() => setView("impact")}
        />
      ) : view === "impact" ? (
        <ImpactView
          onBack={() => setView("intelligence")}
          onRecovery={() => setView("recovery")}
          perturbationResult={currentPerturbation}
          project={currentProject}
        />
      ) : view === "recovery" ? (
        <RecoveryView
          onBack={() => setView("impact")}
          onApproved={() => setView("updated")}
          perturbationResult={currentPerturbation}
          project={currentProject}
        />
      ) : view === "domain" ? (
        <DomainSupervisorView
          key={`${currentProject.id}-${activeScenarioId || "default"}`}
          project={currentProject}
          onPublish={publishExecutionEvent}
          activeScenarioId={activeScenarioId}
          onSelectScenario={handleScenarioChange}
        />
      ) : (
        <UpdatedStateView
          perturbationResult={currentPerturbation}
          project={currentProject}
        />
      )}
      </main>
    </div>
  );
}

function SyncraIntro({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(1);
  const [statusMessage, setStatusMessage] = useState("INITIALIZING EXECUTION GRAPH...");

  useEffect(() => {
    const startTime = Date.now();
    const duration = 5400;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 32) {
        setActiveStage(1);
        setStatusMessage("INGESTING FIELD GROUND REALITY (ALPHA FACILITY)...");
      } else if (pct < 68) {
        setActiveStage(2);
        setStatusMessage("RESOLVING L5/L6 CPM SCHEDULE NODES & FLOAT...");
      } else if (pct < 92) {
        setActiveStage(3);
        setStatusMessage("GENERATING REAL-TIME RECOVERY VECTORS...");
      } else {
        setStatusMessage("EXECUTION INTELLIGENCE ENGINE ONLINE");
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        onComplete();
      }
    }, 35);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="syncra-intro">
      <div className="intro-aurora aurora-1"></div>
      <div className="intro-aurora aurora-2"></div>
      <div className="intro-aurora aurora-3"></div>
      <div className="intro-scanline"></div>
      <div className="intro-grid"></div>
      <div className="intro-noise"></div>

      <div className="intro-content">
        <div className="intro-eyebrow">
          <span className="intro-live-dot"></span>
          <span className="intro-eyebrow-text">EXECUTION INTELLIGENCE ENGINE · v1.4</span>
          <span className="intro-badge">SYSTEM ACTIVE</span>
        </div>

        <div className="intro-brand">
          <div className="intro-brand-mark-wrapper">
            <div className="intro-brand-halo"></div>
            <div className="intro-brand-mark">S</div>
          </div>

          <div className="intro-brand-text">
            <div className="intro-brand-name">SYNCRA</div>
            <div className="intro-tagline">EXECUTION INTELLIGENCE PLATFORM</div>
          </div>
        </div>

        <div className="intro-subtitle">
          Bridging real-time field reality with project schedule critical paths.
        </div>

        <div className="intro-telemetry-strip">
          <span className="telemetry-item">
            <span className="telemetry-indicator"></span>
            NETWORK: <b>ENTERPRISE CAPITAL PORTFOLIO</b>
          </span>
          <span className="telemetry-sep">/</span>
          <span className="telemetry-item">
            WBS DEPTH: <b>L5/L6 PACKAGES</b>
          </span>
          <span className="telemetry-sep">/</span>
          <span className="telemetry-item">
            ENGINE: <b>CPM DYNAMIC GRAPH</b>
          </span>
        </div>

        <div className="intro-system">
          <div className={`intro-node intro-node-field ${activeStage >= 1 ? "active-node" : ""}`}>
            <div className="node-glow"></div>
            <div className="node-top">
              <span>01 / TELEMETRY</span>
              <span className="node-status-dot"></span>
            </div>
            <strong>FIELD REALITY</strong>
            <small>Direct supervisor observations, site photos & constraints</small>
            <div className="node-meta">Workfront · Grid A-14</div>
          </div>

          <div className={`intro-connector ${activeStage >= 2 ? "active-flow" : ""}`}>
            <div className="connector-line"></div>
            <div className="connector-beam"></div>
            <span className="connector-arrow">→</span>
          </div>

          <div className={`intro-node intro-node-state ${activeStage >= 2 ? "active-node" : ""}`}>
            <div className="node-glow"></div>
            <div className="node-top">
              <span>02 / CPM MESH</span>
              <span className="node-status-dot"></span>
            </div>
            <strong>SCHEDULE NETWORK</strong>
            <small>Predecessors, float erosion & critical-path impact</small>
            <div className="node-meta">Variance Detection</div>
          </div>

          <div className={`intro-connector ${activeStage >= 3 ? "active-flow" : ""}`}>
            <div className="connector-line"></div>
            <div className="connector-beam"></div>
            <span className="connector-arrow">→</span>
          </div>

          <div className={`intro-node intro-node-intelligence ${activeStage >= 3 ? "active-node" : ""}`}>
            <div className="node-glow"></div>
            <div className="node-top">
              <span>03 / MITIGATION</span>
              <span className="node-status-dot"></span>
            </div>
            <strong>DECISION ENGINE</strong>
            <small>Actionable recovery options protecting project finish</small>
            <div className="node-meta">Manager Authority</div>
          </div>
        </div>

        <div className="intro-progress-container">
          <div className="intro-progress-header">
            <span className="intro-status-msg">{statusMessage}</span>
            <span className="intro-pct">{progress}%</span>
          </div>
          <div className="intro-progress-track">
            <div className="intro-progress-bar" style={{ width: `${progress}%` }}>
              <div className="intro-progress-flare"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="intro-footer">
        <div className="intro-footer-brand">
          <strong>SYNCRA</strong>
          <span>INFRASTRUCTURE & CAPITAL PROJECTS INTELLIGENCE</span>
        </div>
        <button
          type="button"
          className="intro-skip-btn"
          onClick={onComplete}
        >
          <span>Enter Command Center</span>
          <span className="skip-arrow">→</span>
        </button>
      </div>
    </div>
  );
}

function WorkspaceDirectoryView({ user, onSelectProject, onLogout }) {
  const projects = getAllProjects();

  return (
    <div className="workspace-shell">
      {/* GLOBAL ENTERPRISE TOPBAR */}
      <header className="workspace-topbar">
        <div className="workspace-brand">
          <div className="brand-mark">S</div>
          <div>
            <div className="brand-name">SYNCRA</div>
            <div className="brand-subtitle">Enterprise Capital Portfolio</div>
          </div>
        </div>

        <div className="workspace-user-strip">
          <div className="user-avatar">{user?.role === "domain" ? "DS" : "RM"}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || "Ravi Mehta"}</div>
            <div className="user-role">{user?.roleTitle || "Project Manager"}</div>
          </div>
          <button
            id="btn-workspace-signout"
            type="button"
            className="workspace-signout-btn"
            onClick={onLogout}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* PORTFOLIO CONTENT CONTAINER */}
      <main className="workspace-content">
        <div className="workspace-intro-hero">
          <div>
            <p className="section-kicker">CAPITAL PROJECTS DIRECTORY</p>
            <h2>Enterprise Projects Workspace</h2>
            <p className="workspace-sub">
              Select an active capital project to inspect execution truth, CPM dependency networks, and living schedules.
            </p>
          </div>

          <div className="portfolio-stats-pill">
            <div className="stat-unit">
              <span>PORTFOLIO SIZE</span>
              <strong>{projects.length} Capital Projects</strong>
            </div>
            <div className="stat-unit-divider"></div>
            <div className="stat-unit">
              <span>ACTIVE LOCATIONS</span>
              <strong>Assam · Rajasthan</strong>
            </div>
            <div className="stat-unit-divider"></div>
            <div className="stat-unit">
              <span>SYSTEM HEALTH</span>
              <strong className="amber-text">1 Alert · 1 Nominal</strong>
            </div>
          </div>
        </div>

        {/* PROJECTS GRID */}
        <div className="workspace-projects-grid">
          {projects.map((proj) => (
            <div
              key={proj.id}
              id={`workspace-card-${proj.id}`}
              className="workspace-project-card"
              onClick={() => onSelectProject(proj.id)}
              style={{ cursor: "pointer" }}
            >
              <div className="card-top-row">
                <div>
                  <span className="project-code-tag">{proj.code}</span>
                  <span className="project-sector-tag">{proj.sector}</span>
                </div>
                <span className={`project-health-badge ${proj.healthTone}`}>
                  {proj.health}
                </span>
              </div>

              <div className="card-main-title">
                <h3>{proj.name}</h3>
                <div className="project-location-pin">
                  <span>📍</span>
                  <strong>{proj.location}</strong>
                  <span className="client-sub">• {proj.client}</span>
                </div>
              </div>

              <div className="card-meta-grid">
                <div className="meta-box">
                  <span>STATUS DATE</span>
                  <strong>{proj.statusDate}</strong>
                </div>
                <div className="meta-box">
                  <span>BASELINE FINISH</span>
                  <strong>Day {proj.baselineFinishDay}</strong>
                </div>
                <div className="meta-box">
                  <span>FORECAST FINISH</span>
                  <strong className={proj.forecastFinishDay > proj.baselineFinishDay ? "red-text" : "green-text"}>
                    Day {proj.forecastFinishDay} {proj.forecastFinishDay > proj.baselineFinishDay ? `(+${proj.forecastFinishDay - proj.baselineFinishDay}d)` : "(On Time)"}
                  </strong>
                </div>
                <div className="meta-box">
                  <span>ACTIVE NETWORK</span>
                  <strong>{proj.activities.length} WBS Activities</strong>
                </div>
              </div>

              <div className="card-critical-preview">
                <span>DRIVING CRITICAL CHAIN:</span>
                <code>{proj.summaryStats.criticalChainPreview}</code>
              </div>

              <div className="card-footer-row">
                <div className="supervisor-tag">
                  <span>Lead Supervisor:</span> <strong>{proj.supervisor.name}</strong>
                  <small>({proj.supervisor.assignedWorkfront})</small>
                </div>

                <div className="open-btn-container" style={{ display: "inline-flex" }}>
                  <button
                    id={`btn-open-${proj.id}`}
                    type="button"
                    className="open-project-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProject(proj.id);
                    }}
                  >
                    <span>Open Project Workspace</span>
                    <span className="btn-arrow">→</span>
                  </button>
                  {proj.id === "alpha-facility-assam" && (
                    <button
                      id="btn-open-alpha-facility"
                      type="button"
                      style={{ display: "none" }}
                      aria-hidden="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject("alpha-facility-assam");
                      }}
                    />
                  )}
                  {proj.id === "thar-solar-rajasthan" && (
                    <button
                      id="btn-open-rajasthan"
                      type="button"
                      style={{ display: "none" }}
                      aria-hidden="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject("thar-solar-rajasthan");
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function LoginView({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const MOCK_USERS = {
    manager01: {
      id: "manager01",
      name: "Ravi Mehta",
      role: "manager",
      roleTitle: "Project Manager",
      password: "syncra123",
    },
    domain01: {
      id: "domain01",
      name: "Arjun Sharma",
      role: "domain",
      roleTitle: "Lead Domain Supervisor",
      password: "syncra123",
    },
  };

  const handleLogin = (e) => {
    e.preventDefault();

    const user = MOCK_USERS[userId.trim().toLowerCase()];

    if (!user || user.password !== password) {
      setError("Invalid user ID or password.");
      return;
    }

    setError("");
    onLogin(user.role, user);
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-mark">S</div>
          <div>
            <div className="login-brand-name">SYNCRA</div>
            <div className="login-brand-subtitle">Execution Intelligence</div>
          </div>
        </div>

        <div className="login-heading">
          <p className="section-kicker">ENTERPRISE ACCESS</p>
          <h1>Sign in to SYNCRA</h1>
          <p>Unified EPC Execution Intelligence & Project Controls</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <label htmlFor="user-id">USER ID</label>
            <input
              id="user-id"
              type="text"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setError("");
              }}
              placeholder="Enter your user ID"
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">PASSWORD</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error">
              <span>!</span>
              {error}
            </div>
          )}

          <button className="login-button" type="submit">
            Sign in <span>→</span>
          </button>
        </form>

        <div className="login-quick-roles">
          <span className="section-kicker">QUICK SIGN-IN FOR DEMO</span>
          <div className="quick-role-buttons">
            <button
              id="btn-quick-login-manager"
              type="button"
              className="quick-role-btn"
              onClick={() => onLogin("manager", MOCK_USERS.manager01)}
            >
              <span>👔</span>
              <div>
                <strong>Project Manager</strong>
                <small>Ravi Mehta · Enterprise PM</small>
              </div>
            </button>
            <button
              id="btn-quick-login-domain"
              type="button"
              className="quick-role-btn"
              onClick={() => onLogin("domain", MOCK_USERS.domain01)}
            >
              <span>🏗️</span>
              <div>
                <strong>Domain Supervisor</strong>
                <small>Arjun Sharma · Field Supervisor</small>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntelligenceView({
  executionEvent,
  incomingEvent,
  project,
  perturbationResult,
  onBack,
  onImpact,
}) {
  const isSandbox = Boolean(project?.capabilities?.hasSimulationSandbox);
  const activeAct = project?.activities?.find((a) => a.id === executionEvent?.activity) || project?.activities?.[2] || project?.activities?.[0];
  const targetFloat = perturbationResult?.targetNode?.id === executionEvent?.activity
    ? (perturbationResult.targetNode.totalFloat ?? 0)
    : (activeAct?.totalFloat ?? 0);
  const assignedEquipment = isSandbox ? "EX-07 Excavator" : "Array Stringing Rig #4";

  const predId = activeAct?.predecessors?.[0]?.id;
  const succId = activeAct?.successors?.[0]?.id;
  const predNode = predId ? project?.activities?.find((a) => a.id === predId) : null;
  const succNode = succId ? project?.activities?.find((a) => a.id === succId) : null;

  const drivingChain = perturbationResult?.exposedCriticalChain || [];
  const chain0 = drivingChain[0]?.id || executionEvent?.activity || "SP-204";
  const chain1 = drivingChain[1]?.id || succNode?.id || (isSandbox ? "CF-108" : "SP-208");
  const chainTerminal = drivingChain[drivingChain.length - 1]?.id || (isSandbox ? "M-03" : "M-04");
  const chainTerminalName = drivingChain[drivingChain.length - 1]?.name || (isSandbox ? "Substantial Completion" : "Commercial Operation Date");
  const chain1Name = drivingChain[1]?.name || succNode?.name || (isSandbox ? "Foundation Pour" : "Inverter Station Hookup");

  // No event received yet
  if (!executionEvent) {
    return (
      <section className="content intelligence-page">
        <button className="back-button" onClick={onBack} type="button">
          ← Back to overview
        </button>

        <div className="intelligence-heading">
          <div>
            <p className="section-kicker">EXECUTION INTELLIGENCE</p>
            <h2>Waiting for field execution event</h2>
            <p>
              SYNCRA is listening for verified execution updates from the
              field.
            </p>
          </div>

          <div className="processing-pill">
            <span></span>
            Listening
          </div>
        </div>

        <div className="empty-intelligence-state">
          <div className="empty-state-icon">◌</div>

          <h3>No new execution event</h3>

          <p>
            Submit a Daily Report from the Domain Supervisor workspace.
            The verified event will appear here automatically.
          </p>
        </div>
      </section>
    );
  }

  // Event has arrived — show the normal Intelligence page
  return (
  <section className="content intelligence-page">

    {/* REAL-TIME RECEIVING ANIMATION */}
    {incomingEvent && (
      <div className="incoming-event-overlay">
        <div className="incoming-event-card">

          <div className="incoming-event-top">
            <span className="incoming-live-dot"></span>
            LIVE PROJECT EVENT
          </div>

          <div className="incoming-event-icon">
            ✓
          </div>

          <p className="section-kicker">
            EXECUTION EVENT RECEIVED
          </p>

          <h2>New field reality detected</h2>

          <p className="incoming-event-description">
            {incomingEvent.activity} · {incomingEvent.activityName}
          </p>

          <div className="incoming-event-location">
            {incomingEvent.location} · {incomingEvent.discipline}
          </div>

          <div className="incoming-event-flow">

            <div className="incoming-flow-step active">
              <span>01</span>
              <strong>FIELD REPORT</strong>
              <small>Received</small>
            </div>

            <div className="incoming-flow-line"></div>

            <div className="incoming-flow-step active">
              <span>02</span>
              <strong>SYNCRA VERIFY</strong>
              <small>
                {incomingEvent.confidence}% confidence
              </small>
            </div>

            <div className="incoming-flow-line"></div>

            <div className="incoming-flow-step active">
              <span>03</span>
              <strong>PROJECT STATE</strong>
              <small>Updated</small>
            </div>

          </div>

          <div className="incoming-event-footer">
            <span>VERIFIED EXECUTION EVENT</span>
            <strong>✓</strong>
          </div>

        </div>
      </div>
    )}

    {/* YOUR EXISTING INTELLIGENCE CONTENT STARTS HERE */}

    <button
      className="back-button"
      onClick={onBack}
      type="button"
    >
      ← Back to overview
    </button>

    <div className="intelligence-heading">
        <div>
          <p className="section-kicker">EXECUTION EVENT</p>
          <h2>
            {executionEvent.issue && executionEvent.issue !== "Execution update received from the field."
              ? executionEvent.issue
              : `${executionEvent.activity} · ${executionEvent.activityName}`}
          </h2>
          <p>
            SYNCRA is evaluating field evidence against the current
            project state.
          </p>
        </div>

        <div className="processing-pill">
          <span></span>
          Analysis complete
        </div>
      </div>

      {/* REAL-TIME EVENT RECEIVED */}
      <div className="shared-event-banner">
        <div className="shared-event-icon">✓</div>

        <div>
          <span>NEW VERIFIED EXECUTION EVENT</span>

          <strong>
            {executionEvent.activity} · {executionEvent.activityName}
          </strong>

          <p>
            Published from Domain Supervisor · {executionEvent.date} ·{" "}
            {executionEvent.time}
          </p>
        </div>

        <div className="shared-event-status">VERIFIED</div>
      </div>

      <div className="intelligence-grid">
        {/* FIELD UPDATE */}
        <div className="panel event-panel">
          <div className="panel-header">
            <div>
              <p className="section-kicker">FIELD UPDATE</p>
              <h3>Submitted evidence</h3>
            </div>

            <span className="event-status">
              {executionEvent.state?.toUpperCase() || "BLOCKED"}
            </span>
          </div>

          <div className="event-details">
            <div>
              <span>ACTIVITY</span>
              <strong>{executionEvent.activity}</strong>
            </div>

            <div>
              <span>WORKFRONT</span>
              <strong>{executionEvent.location}</strong>
            </div>

            <div>
              <span>SUBMITTED BY</span>
              <strong>Domain Supervisor</strong>
            </div>

            <div>
              <span>TIME</span>
              <strong>
                {executionEvent.time} · {executionEvent.date}
              </strong>
            </div>
          </div>

          <div className="evidence-box">
            <div className="evidence-icon">▧</div>

            <div>
              <strong>{executionEvent.evidence}</strong>

              <p>
                {executionEvent.issue ||
                  "Execution update received from the field."}
              </p>
            </div>

            <span className="verified-tag">Evidence received</span>
          </div>

          <div className="field-note">
            <span>FIELD NOTE</span>

            <p>
              {executionEvent.issue
                ? `“${executionEvent.issue} reported at ${executionEvent.location}. Logged by ${project?.supervisor?.name || "Field Supervisor"}.”`
                : `“Execution update recorded for ${executionEvent.activity} at ${executionEvent.location}.”`}
            </p>
          </div>
        </div>

        {/* SYNCRA ANALYSIS */}
        <div className="panel analysis-panel">
          <div className="panel-header">
            <div>
              <p className="section-kicker">SYNCRA ANALYSIS</p>
              <h3>What does the evidence indicate?</h3>
            </div>

            <div className="confidence">
              <strong>{executionEvent.confidence}%</strong>
              <span>confidence</span>
            </div>
          </div>

          <div className="analysis-result">
            <div className="result-icon">✓</div>

            <div>
              <span className="result-label">ACTIVITY MATCH</span>

              <strong>
                {executionEvent.activity} · {executionEvent.activityName}
              </strong>

              <p>
                Field evidence is consistent with the current activity
                and workfront.
              </p>
            </div>
          </div>

          <div className="evidence-checks">
            <div className="check-row">
              <span className="check">✓</span>

              <div>
                <strong>Location consistent</strong>
                <p>
                  {executionEvent.location} matches the planned
                  workfront.
                </p>
              </div>
            </div>

            <div className="check-row">
              <span className="check">✓</span>

              <div>
                <strong>Activity state consistent</strong>
                <p>
                  Evidence supports a {executionEvent.state?.toLowerCase() ||
                    "blocked"} execution state.
                </p>
              </div>
            </div>

            <div className="check-row">
              <span className="check">✓</span>

              <div>
                <strong>Evidence sufficient</strong>
                <p>
                  Photographs and field note support the claim.
                </p>
              </div>
            </div>
          </div>

          {/* PROJECT STATE */}
          <div className="project-state-card">
            <div className="panel-header">
              <div>
                <p className="section-kicker">PROJECT STATE</p>
                <h3>Current execution state</h3>
              </div>

              <span className="state-verified">✓ VERIFIED</span>
            </div>

            <div className="state-grid">
              <div>
                <span>ACTIVITY</span>
                <strong>{executionEvent.activity}</strong>
              </div>

              <div>
                <span>STATE</span>
                <strong className="blocked-text">
                  {executionEvent.state}
                </strong>
              </div>

              <div>
                <span>LOCATION</span>
                <strong>{executionEvent.location}</strong>
              </div>

              <div>
                <span>PROGRESS</span>
                <strong>{executionEvent.progress}</strong>
              </div>

              <div>
                <span>FLOAT</span>
                <strong className={targetFloat === 0 ? "amber-text" : "green-text"}>
                  {targetFloat} {targetFloat === 1 ? "day" : "days"}
                </strong>
              </div>

              <div>
                <span>EQUIPMENT</span>
                <strong>{assignedEquipment}</strong>
              </div>

              <div>
                <span>DOMAIN</span>
                <strong>{executionEvent.discipline}</strong>
              </div>

              <div>
                <span>LAST VERIFIED</span>
                <strong>
                  {executionEvent.date} · {executionEvent.time}
                </strong>
              </div>
            </div>

            <div className="state-line">
              <div className="state-line-item">
                <span>PREDECESSOR</span>
                <strong>{predNode ? `${predNode.id} · ${predNode.status}` : "Network Start · Complete"}</strong>
              </div>

              <div className="state-arrow">→</div>

              <div className="state-line-item current">
                <span>CURRENT</span>
                <strong>
                  {executionEvent.activity} · {executionEvent.state}
                </strong>
              </div>

              <div className="state-arrow">→</div>

              <div className="state-line-item">
                <span>NEXT</span>
                <strong>{succNode ? `${succNode.id} · ${succNode.status}` : "Milestone · Scheduled"}</strong>
              </div>
            </div>
          </div>

          {/* CONTEXT INTELLIGENCE */}
          <div className="context-card">
            <div className="panel-header">
              <div>
                <p className="section-kicker">CONTEXT INTELLIGENCE</p>
                <h3>What is influencing this state?</h3>
              </div>

              <span className="context-count">3 SIGNALS</span>
            </div>

            <div className="context-grid">
              <div className="context-item">
                <div className="context-icon resource">R</div>

                <div>
                  <span>RESOURCE</span>
                  <strong>{isSandbox ? "EX-07 Excavator" : "Array Stringing Rig #4"}</strong>
                  <p>{isSandbox ? "Repair in progress · available Day 17" : "Operating nominal · 1.4 MWp/day stringing rate"}</p>
                </div>
              </div>

              <div className="context-item">
                <div className="context-icon weather">W</div>

                <div>
                  <span>WEATHER</span>
                  <strong>{isSandbox ? "Heavy rainfall" : "Optimal High GHI"}</strong>
                  <p>{isSandbox ? "Wet ground · productivity impact likely" : "5.9 kWh/m²/day · Operating envelope normal"}</p>
                </div>
              </div>

              <div className="context-item">
                <div className="context-icon dependency">D</div>

                <div>
                  <span>DEPENDENCY</span>
                  <strong>{succNode ? `${succNode.id} ${succNode.name}` : (isSandbox ? "CF-108 Foundation Pour" : "SP-208 Inverter Hookup")}</strong>
                  <p>{succNode ? `${succNode.status} · successor dependency` : "Successor workfront scheduled"}</p>
                </div>
              </div>
            </div>

            <div className="context-summary">
              <span>COMBINED SIGNAL</span>

              <strong>
                {isSandbox && perturbationResult?.isProjectFinishDelayed
                  ? "Resource constraint + site condition + low float increase exposure"
                  : "Site conditions nominal · Operations tracking within schedule baseline"}
              </strong>
            </div>
          </div>

          {/* PREDICTIVE EXPOSURE */}
          <div className="prediction-card">
            <div className="panel-header">
              <div>
                <p className="section-kicker">PREDICTIVE EXPOSURE</p>
                <h3>What could happen next?</h3>
              </div>

              <span className="exposure-badge">ELEVATED</span>
            </div>

            <div className="prediction-main">
              <div className="prediction-signal">
                <span className="signal-label">
                  LIKELY EXPOSURE PATH
                </span>

                <div className="prediction-chain">
                  <div>
                    <strong>{chain0}</strong>
                    <small>{executionEvent.state}</small>
                  </div>

                  <span>→</span>

                  <div>
                    <strong>{chain1}</strong>
                    <small>Successor</small>
                  </div>

                  <span>→</span>

                  <div>
                    <strong>{chainTerminal}</strong>
                    <small>Milestone</small>
                  </div>
                </div>
              </div>

              <div className="prediction-explanation">
                <span>WHY SYNCRA FLAGS THIS</span>

                <p>
                  {perturbationResult?.isProjectFinishDelayed
                    ? `${executionEvent.activity} has ${targetFloat} days of available float. Disruption propagates downstream through the critical path, pushing milestone delivery from Day ${project?.baselineFinishDay || 30} to Day ${(project?.baselineFinishDay || 30) + (perturbationResult?.projectDelayDays || 0)}.`
                    : `${executionEvent.activity} is executing within normal CPM control boundaries (${targetFloat}d float). Downstream dependencies remain protected toward Day ${project?.baselineFinishDay || 90} completion.`}
                </p>
              </div>
            </div>

            <div className="prediction-footer">
              <div>
                <span>EXPOSURE</span>
                <strong>{chain1} → {chainTerminal}</strong>
              </div>

              <div>
                <span>TRIGGER</span>
                <strong>{isSandbox ? "Constraint persists beyond Day 17" : "Operations tracking per plan"}</strong>
              </div>

              <div>
                <span>CONFIDENCE</span>
                <strong>{executionEvent.confidence || 96}%</strong>
              </div>
            </div>
          </div>

          {/* NETWORK SIGNAL */}
          <div className="impact-preview">
            <div>
              <span className="section-kicker">NETWORK SIGNAL</span>
              <h4>Potential downstream exposure</h4>
            </div>

            <div className="impact-chain">
              <span>{chain0}</span>
              <b>→</b>
              <span>{chain1Name}</span>
              <b>→</b>
              <span>{chainTerminalName}</span>
            </div>

            <div className="float-row">
              <span>Remaining float</span>
              <strong>{targetFloat} {targetFloat === 1 ? "day" : "days"}</strong>
            </div>
          </div>

          <button
            className="analysis-action"
            onClick={onImpact}
            type="button"
          >
            Review project impact <span>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function ImpactView({ onBack, onRecovery, perturbationResult, project }) {
  const result = perturbationResult || simulateSchedulePerturbation();
  const target = result.targetNode || { id: "SP-204", name: "Active Workfront", status: "In Progress", totalFloat: 0 };
  const baselineFinish = project ? project.baselineFinishDay : 30;
  const terminalMilestone = (result?.milestoneExposure && (result.milestoneExposure["M-03"] || result.milestoneExposure["M-04"])) ||
    (result?.milestoneExposure ? Object.values(result.milestoneExposure).sort((a, b) => b.perturbedEF - a.perturbedEF)[0] : null);
  const forecastFinish = terminalMilestone ? terminalMilestone.perturbedEF : baselineFinish + (result?.projectDelayDays || 0);
  const finishExposure = terminalMilestone || { perturbedEF: forecastFinish };
  const isDelayed = result.isProjectFinishDelayed;

  return (
    <section className="content">

      <div className="page-intro">
        <button className="back-button" onClick={onBack} type="button">
          ← Back to intelligence
        </button>

        <p className="section-kicker">IMPACT ANALYSIS · DYNAMIC CPM ENGINE</p>
        <h2>What does this state affect?</h2>
        <p>
          SYNCRA recalculates the living schedule network ({project?.name || "Project"}) to trace exact float erosion and downstream milestone variance.
        </p>
      </div>

      <div className="impact-summary">
        <div>
          <span>TRIGGER</span>
          <strong>{target.id} · {target.status}</strong>
        </div>

        <div>
          <span>NETWORK EXPOSURE</span>
          <strong>{result.erodedActivities.length} affected {result.erodedActivities.length === 1 ? "activity" : "activities"}</strong>
        </div>

        <div>
          <span>PROJECT FINISH</span>
          <strong className={isDelayed ? "red-text" : "green-text"}>
            {isDelayed
              ? `Day ${finishExposure.perturbedEF} (+${result.projectDelayDays}d delay)`
              : `Day ${finishExposure.perturbedEF} (Preserved · 0d variance)`}
          </strong>
        </div>

        <div>
          <span>FLOAT</span>
          <strong className={target.totalFloat === 0 ? "amber-text" : "green-text"}>
            {target.totalFloat} {target.totalFloat === 1 ? "day" : "days"} remaining
          </strong>
        </div>
      </div>

      <div className="impact-card">
        <div className="panel-header">
          <div>
            <p className="section-kicker">DEPENDENCY IMPACT</p>
            <h3>Dynamically calculated driving chain to completion</h3>
          </div>

          <span className={`impact-level ${isDelayed ? "danger" : "warning"}`}>
            {isDelayed ? "CRITICAL SLIPPAGE" : "FLOAT BUFFER ABSORPTION"}
          </span>
        </div>

        <div className="impact-chain">
          {result.exposedCriticalChain.map((node, idx) => (
            <div key={node.id} style={{ display: "contents" }}>
              <div className={`impact-node ${idx === 0 ? "blocked" : "exposed"}`}>
                <span>{idx === 0 ? "DISTURBANCE" : (node.id === "M-03" || node.id === "M-04" || idx === result.exposedCriticalChain.length - 1) ? "TERMINAL MILESTONE" : "DRIVING CHAIN"}</span>
                <strong>{node.id}</strong>
                <small>{node.name} (EF: Day {node.earlyFinish})</small>
              </div>
              {idx < result.exposedCriticalChain.length - 1 && (
                <div className="impact-connector">
                  <span>FS</span>
                  <i>→</i>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="impact-analysis-grid">

        <div className="impact-detail-card">
          <p className="section-kicker">SCHEDULE EFFECT</p>
          <h3>Dynamic CPM Network Recalculation</h3>

          <div className="effect-row">
            <span>Activity delay</span>
            <strong>+{result.disturbance.delayDays} {result.disturbance.delayDays === 1 ? "day" : "days"}</strong>
          </div>

          <div className="effect-row">
            <span>Successor exposure</span>
            <strong>{result.erodedActivities.length > 0 ? `${result.erodedActivities.length} activities` : "None"}</strong>
          </div>

          <div className="effect-row">
            <span>Critical path exposure</span>
            <strong className={isDelayed ? "red-text" : "amber-text"}>
              {isDelayed ? "Direct Critical Slippage" : "Absorbed within Float"}
            </strong>
          </div>

          <div className="effect-row">
            <span>Project finish impact</span>
            <strong className={isDelayed ? "red-text" : "green-text"}>
              {isDelayed
                ? `Day ${baselineFinish} ➔ Day ${finishExposure.perturbedEF} (+${result.projectDelayDays}d)`
                : `None (Day ${baselineFinish} Preserved)`}
            </strong>
          </div>
        </div>

        <div className="impact-detail-card">
          <p className="section-kicker">WHY IT MATTERS</p>
          <h3>Float protection & downstream propagation</h3>

          <p className="impact-copy">
            {isDelayed
              ? `${target.id} has 0 days of available float on the active critical chain. The +${result.disturbance.delayDays}-day delay directly propagates downstream through ${result.exposedCriticalChain.slice(1, -1).map(n => n.id).join(" → ")} to completion milestone, pushing project delivery from Day ${baselineFinish} to Day ${finishExposure.perturbedEF}.`
              : `${target.id} consumed available total float buffer without downstream critical slippage. Milestone delivery remains protected at Day ${baselineFinish}.`}
          </p>

          <div className="impact-rule">
            <span>PROJECT IMPACT RULE</span>
            <strong>
              {isDelayed ? "Critical delay = Project delay" : "Float absorbed = Project protected"}
            </strong>
          </div>
        </div>

      </div>

      <div className="impact-decision">
        <div>
          <p className="section-kicker">NEXT DECISION</p>
          <h3>
            {isDelayed
              ? "Critical milestone exposed. Manager intervention required."
              : "Variance absorbed into float buffer. Review optional recovery actions."}
          </h3>
          <p>
            SYNCRA dynamically calculated this network exposure from ground reality. Review recovery scenarios below.
          </p>
        </div>

        <button
          className="recovery-button"
          onClick={onRecovery}
          type="button"
        >
          View recovery options <span>→</span>
        </button>
      </div>

    </section>
  );
}

function RecoveryView({ onBack, onApproved, perturbationResult, project }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const result = perturbationResult || simulateSchedulePerturbation();
  const targetId = result.targetNode?.id || "SP-204";
  const delayDays = result.projectDelayDays || 0;
  const baselineFinish = project ? project.baselineFinishDay : 30;
  const terminalMilestone = (result?.milestoneExposure && (result.milestoneExposure["M-03"] || result.milestoneExposure["M-04"])) ||
    (result?.milestoneExposure ? Object.values(result.milestoneExposure).sort((a, b) => b.perturbedEF - a.perturbedEF)[0] : null);
  const finishDay = terminalMilestone ? terminalMilestone.perturbedEF : baselineFinish + delayDays;

  const plans = [
    {
      id: "A",
      title: "Resequence work",
      description: `Move an independent downstream workfront forward while ${targetId} is constrained.`,
      forecast: "0 days",
      schedule: `Protects current finish at Day ${baselineFinish}`,
      resource: "Low",
      risk: "Moderate",
      consequence: "Uses available workfront capacity",
      recommended: true,
    },
    {
      id: "B",
      title: "Shift resources",
      description: `Reassign available capacity from an off-critical workfront to recover ${targetId}.`,
      forecast: "+1 day",
      schedule: `Minor finish exposure (Day ${baselineFinish + 1})`,
      resource: "Medium",
      risk: "Low",
      consequence: "Creates pressure on donor workfront",
      recommended: false,
    },
    {
      id: "C",
      title: "Accept variance",
      description: "Allow the current constraint to continue without recovery intervention.",
      forecast: `+${delayDays} days`,
      schedule: `Finish moves to Day ${finishDay}`,
      resource: "None",
      risk: "High",
      consequence: `Consumes remaining float and delays project completion to Day ${finishDay}`,
      recommended: false,
    },
  ];

  return (
    <section className="content">

      <div className="page-intro">
        <button className="back-button" onClick={onBack} type="button">
          ← Back to impact
        </button>

        <p className="section-kicker">RECOVERY INTELLIGENCE</p>

        <h2>How can the project recover?</h2>

        <p>
          SYNCRA converts the identified exposure into actionable recovery
          options. The manager remains the decision authority.
        </p>
      </div>

      <div className="recovery-context">
        <div>
          <span>TRIGGER</span>
          <strong>{result.targetNode.id} · {result.targetNode.status}</strong>
        </div>

        <div>
          <span>AVAILABLE FLOAT</span>
          <strong className={result.targetNode.totalFloat === 0 ? "amber-text" : "green-text"}>
            {result.targetNode.totalFloat} {result.targetNode.totalFloat === 1 ? "day" : "days"}
          </strong>
        </div>

        <div>
          <span>EXPOSED CHAIN</span>
          <strong>{result.exposedCriticalChain.slice(0, 3).map(n => n.id).join(" → ")}...</strong>
        </div>

        <div>
          <span>CURRENT FORECAST</span>
          <strong className={result.projectDelayDays > 0 ? "red-text" : "green-text"}>
            Day {finishDay} {result.projectDelayDays > 0 ? `(+${result.projectDelayDays}d)` : "(On Time)"}
          </strong>
        </div>
      </div>

      <div className="recovery-header">
        <div>
          <p className="section-kicker">GENERATED OPTIONS</p>
          <h3>Compare recovery consequences</h3>
        </div>

        <span className="manager-authority">
          manager DECISION
        </span>
      </div>

      <div className="recovery-options">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className={`recovery-option ${
              selectedPlan === plan.id ? "selected" : ""
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <div className="recovery-option-top">
              <div className="plan-number">PLAN {plan.id}</div>

              {plan.recommended && (
                <span className="recommended-tag">SYNCRA RECOMMENDS</span>
              )}
            </div>

            <h3>{plan.title}</h3>

            <p className="plan-description">
              {plan.description}
            </p>

            <div className="plan-metrics">

              <div>
                <span>FORECAST</span>
                <strong>{plan.forecast}</strong>
              </div>

              <div>
                <span>SCHEDULE</span>
                <strong>{plan.schedule}</strong>
              </div>

              <div>
                <span>RESOURCE LOAD</span>
                <strong>{plan.resource}</strong>
              </div>

              <div>
                <span>RISK</span>
                <strong>{plan.risk}</strong>
              </div>

            </div>

            <div className="plan-consequence">
              <span>CONSEQUENCE</span>
              <strong>{plan.consequence}</strong>
            </div>
          </button>
        ))}
      </div>

      <div className="recovery-reasoning">
        <div>
          <p className="section-kicker">SYNCRA REASONING</p>

          <h3>
            Why Plan A is being recommended
          </h3>

          <p>
            Plan A protects the current project finish without requiring
            additional resource allocation. It uses an available workfront
            to absorb the local disruption while preserving the approved
            baseline.
          </p>
        </div>

        <div className="reasoning-factors">
          <div>
            <span>FLOAT</span>
            <strong>{result.targetNode.totalFloat}d remaining</strong>
          </div>

          <div>
            <span>DISTURBANCE</span>
            <strong>{result.targetNode.status}</strong>
          </div>

          <div>
            <span>DOWNSTREAM</span>
            <strong>{result.erodedActivities.length} eroded</strong>
          </div>
        </div>
      </div>

      <div className="approval-bar">
        <div>
          <span>SELECTED DECISION</span>

          <strong>
            {selectedPlan
              ? `Plan ${selectedPlan} · ${
                  plans.find((p) => p.id === selectedPlan)?.title
                }`
              : "Select a recovery option"}
          </strong>
        </div>

        <button
          className="approve-button"
          disabled={!selectedPlan}
          onClick={onApproved}
          type="button"
        >
          Approve selected plan →
        </button>
      </div>

    </section>
  );
}

// 10-Stage Pipeline Definition per SYNCRA Master Project Report (Part V, Section 23)
const PIPELINE_STAGES = [
  { id: 1, name: "RAW FIELD INPUT", short: "Field Input", icon: "✎" },
  { id: 2, name: "PLAN/CONTEXT FILTER", short: "Context Filter", icon: "⌖" },
  { id: 3, name: "STRUCTURED EXECUTION EVENT", short: "Structured Event", icon: "▤" },
  { id: 4, name: "CANDIDATE GENERATION", short: "Candidate Gen", icon: "☵" },
  { id: 5, name: "CONFIDENCE SCORE + CANDIDATE MARGIN", short: "Confidence & Margin", icon: "◈" },
  { id: 6, name: "CONTEXT MATCH SCORE", short: "Context Match", icon: "⬡" },
  { id: 7, name: "CROSS-VALIDATION / HARD CHECKS", short: "Cross-Validation", icon: "🛡" },
  { id: 8, name: "AUTOMATION GATE", short: "Automation Gate", icon: "⚙" },
  { id: 9, name: "AUTO-ACCEPT / REVIEW / UNRESOLVED", short: "Gate Decision", icon: "⚖" },
  { id: 10, name: "VERIFIED EXECUTION EVENT", short: "Verified Event", icon: "✓" },
];

// Scenario metric configurations per SYNCRA Master Project Report
const SCENARIO_DATA = {
  "auto-accept": {
    confidence: 94,
    margin: 33,
    contextMatch: 96,
    topCandidate: "CF-104 (Foundation Excavation)",
    topScore: 94,
    secondCandidate: "CF-109 (Storm Drainage Trench)",
    secondScore: 61,
    cpmCheck: "Consistent (PASS)",
    depCheck: "Consistent (PASS)",
    locCheck: "Consistent (Grid A-14) (PASS)",
    resCheck: "Consistent (EX-07 Excavator verified) (PASS)",
    eviCheck: "Consistent (4 GPS photos corroborate) (PASS)",
    hardCheckPass: true,
    materialContradiction: false,
    gateRouting: "AUTO-ACCEPT",
    gateClass: "gate-auto-accept",
    gateExplanation:
      "Confidence ≥90% (94%) AND Context Match ≥90% (96%) AND Margin ≥15 pp (+33 pp) AND no hard-check failure = AUTO-ACCEPT. Routine high-confidence event accepted without forcing supervisor confirmation.",
    systemAction: "Create accepted execution event; retain scores, rationale and evidence provenance.",
  },
  "ambiguity": {
    confidence: 92,
    margin: 4,
    contextMatch: 95,
    topCandidate: "CF-104 (Foundation Excavation)",
    topScore: 92,
    secondCandidate: "CF-105 (Foundation Trench Preparation)",
    secondScore: 88,
    cpmCheck: "Consistent (PASS)",
    depCheck: "Consistent (PASS)",
    locCheck: "Consistent (Grid A-14) (PASS)",
    resCheck: "Consistent (PASS)",
    eviCheck: "Consistent (PASS)",
    hardCheckPass: true,
    materialContradiction: false,
    gateRouting: "REVIEW",
    gateClass: "gate-review",
    gateExplanation:
      "Both scores strong (≥90%), but Candidate Margin is only +4 pp (<15 pp threshold). Candidate ambiguity detected between CF-104 and CF-105; do not auto-accept.",
    systemAction: "Candidate ambiguity; routed to planner review queue.",
  },
  "context-mismatch": {
    confidence: 94,
    margin: 28,
    contextMatch: 81,
    topCandidate: "CF-104 (Foundation Excavation)",
    topScore: 94,
    secondCandidate: "CF-109 (Storm Drainage Trench)",
    secondScore: 66,
    cpmCheck: "Inconsistent: Predecessor handover milestone unverified in schedule",
    depCheck: "Warning: Upstream soil clearance pending",
    locCheck: "Consistent (Grid A-14) (PASS)",
    resCheck: "Consistent (PASS)",
    eviCheck: "Consistent (PASS)",
    hardCheckPass: false,
    materialContradiction: false,
    gateRouting: "REVIEW",
    gateClass: "gate-review",
    gateExplanation:
      "Confidence ≥90% (94%), but Context Match <90% (81%). Field activity identity is strong, but living CPM schedule context is inconsistent.",
    systemAction: "Schedule context inconsistency; routed to human review.",
  },
  "contradiction": {
    confidence: 95,
    margin: 34,
    contextMatch: 94,
    topCandidate: "CF-104 (Foundation Excavation)",
    topScore: 95,
    secondCandidate: "CF-109 (Storm Drainage Trench)",
    secondScore: 61,
    cpmCheck: "Consistent (PASS)",
    depCheck: "Consistent (PASS)",
    locCheck: "FAILED: GPS telemetry reports excavator EX-07 at Sector C, not Grid A-14",
    resCheck: "FAILED: Resource log conflict",
    eviCheck: "Inconclusive timestamp",
    hardCheckPass: false,
    materialContradiction: true,
    gateRouting: "MANDATORY REVIEW",
    gateClass: "gate-danger",
    gateExplanation:
      "Material location/resource contradiction detected! In SYNCRA architecture, material contradictions ALWAYS override numeric scores.",
    systemAction: "Override numeric scores; route to conflict resolution pipeline.",
  },
  "unresolved": {
    confidence: 68,
    margin: 8,
    contextMatch: 72,
    topCandidate: "CF-104 (Foundation Excavation)",
    topScore: 68,
    secondCandidate: "GEN-01 (General Earthworks)",
    secondScore: 60,
    cpmCheck: "Indeterminate",
    depCheck: "Indeterminate",
    locCheck: "Unverified",
    resCheck: "Unspecified",
    eviCheck: "Missing photo corroboration",
    hardCheckPass: false,
    materialContradiction: false,
    gateRouting: "UNRESOLVED / MANUAL",
    gateClass: "gate-unresolved",
    gateExplanation:
      "Either score <75% (Confidence: 68%, Context Match: 72%). Field report too vague or lacking corroborating evidence. Event cannot be automatically attached.",
    systemAction: "Do not automatically attach or accept event; require supervisor clarification.",
  },
};

function DomainSupervisorView({ onPublish, activeScenarioId, onSelectScenario, project }) {
  const isDemoProject = Boolean(project?.capabilities?.hasSimulationSandbox);
  const initialScenario = isDemoProject ? (getScenarioById(activeScenarioId) || DEMO_SCENARIOS[0]) : null;
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [reportNote, setReportNote] = useState(() => {
    if (isDemoProject && initialScenario) return initialScenario.reportText;
    return `Daily production report [${project?.statusDate || "Day 42"}]: PV module stringing on Block C-08 progressing at 1.4 MWp/day. Inverter foundation pads ready for hookup. Weather conditions clear (GHI 5.9 kWh/m²/day).`;
  });
  const [quantityProgress, setQuantityProgress] = useState(() => (isDemoProject && initialScenario ? initialScenario.quantityProgress : 46));
  const [executionStatus, setExecutionStatus] = useState(() => (isDemoProject && initialScenario ? initialScenario.newStatus : "In Progress"));
  const [evidenceAttached, setEvidenceAttached] = useState(true);
  const [evidenceCount, setEvidenceCount] = useState(() => (isDemoProject && initialScenario ? initialScenario.evidenceCount : 3));
  const [activeTab, setActiveTab] = useState("extracted"); // 'extracted' | 'match' | 'context' | 'evidence'
  const [gateScenario, setGateScenario] = useState(activeScenarioId === "ambiguous-civil" ? "ambiguity" : "auto-accept");
  const [humanActionStatus, setHumanActionStatus] = useState(null); // feedback message for human actions

  // Voice memo dictation simulation
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        if (isDemoProject) {
          setReportNote(
            "Voice transcript [16:42]: Excavation halted at Grid A-14. Struck massive buried concrete obstruction. EX-07 unable to dig. Progress 62%. Need breaker or reroute."
          );
          setExecutionStatus("Blocked");
          setQuantityProgress(62);
        } else {
          setReportNote(
            `Voice transcript [10:30]: ${project?.name || "Thar Solar"} - PV module stringing on Block C-08 running normal. Inverter hookup scheduled. Progress 46%.`
          );
          setExecutionStatus("In Progress");
          setQuantityProgress(46);
        }
      }, 2200);
    }
  };

  const currentScenario = (() => {
    if (isDemoProject) {
      return SCENARIO_DATA[gateScenario] || SCENARIO_DATA["auto-accept"];
    }
    const act = project?.activities?.[2] || { id: "SP-204", name: "PV Module Stringing & Cabling", discipline: "Solar EPC" };
    const secAct = project?.activities?.[3] || { id: "SP-208", name: "Inverter Station Hookup" };
    const loc = project?.supervisor?.assignedWorkfront || "Block C-08 · Inverter Yard";

    return {
      confidence: 96,
      margin: 25,
      contextMatch: 95,
      topCandidate: `${act.id} (${act.name})`,
      topScore: 96,
      secondCandidate: `${secAct.id} (${secAct.name})`,
      secondScore: 71,
      cpmCheck: "Consistent (PASS)",
      depCheck: "Consistent (PASS)",
      locCheck: `Consistent (${loc}) (PASS)`,
      resCheck: "Consistent (Verified) (PASS)",
      eviCheck: "Consistent (Photos corroborate) (PASS)",
      hardCheckPass: true,
      materialContradiction: false,
      gateRouting: "AUTO-ACCEPT",
      gateClass: "gate-auto-accept",
      gateExplanation:
        "Confidence ≥90% (96%) AND Context Match ≥90% (95%) AND Margin ≥15 pp (+25 pp) AND no hard-check failure = AUTO-ACCEPT. Routine high-confidence execution event accepted without forcing confirmation.",
      systemAction: "Create accepted execution event; retain scores, rationale and evidence provenance.",
    };
  })();

  // Publish event callback
  const publishCurrentEvent = useCallback((scenarioToUse) => {
    if (!isDemoProject) {
      const activeAct = project?.activities?.[2] || { id: "SP-204", name: "PV Module Stringing & Cabling", discipline: "Solar EPC" };
      const secAct = project?.activities?.[3] || { id: "SP-208", name: "Inverter Station Hookup" };
      const loc = project?.supervisor?.assignedWorkfront || "Block C-08 · Inverter Yard";

      const event = {
        id: "EV-042",
        activity: activeAct.id,
        activityName: activeAct.name,
        location: loc,
        discipline: activeAct.discipline,
        workfront: loc,
        state: executionStatus,
        progress: `${quantityProgress}%`,
        date: project?.statusDate || "Day 42",
        time: "10:30",
        confidence: 96,
        margin: 25,
        contextMatch: 95,
        evidence: `${evidenceCount} field photographs`,
        issue: "Standard daily production tracking",
        gateRouting: "AUTO-ACCEPT",
        isAutoAccept: true,
        gateExplanation: "Progress consistent with schedule plan",
        topCandidate: `${activeAct.id} (${activeAct.name})`,
        secondCandidate: `${secAct.id} (${secAct.name})`,
        hardChecks: "PASS"
      };
      if (onPublish) onPublish(event);
      return;
    }

    const sc = scenarioToUse || getScenarioById(activeScenarioId) || SCENARIO_DATA[gateScenario] || SCENARIO_DATA["auto-accept"];
    const evalData = evaluateFieldSignal({ scenarioKey: activeScenarioId || gateScenario });

    const event = {
      id: activeScenarioId === "mp301-delay" ? "EV-015" : activeScenarioId === "ambiguous-civil" ? "EV-016" : "EV-014",
      activity: sc.activityId || "CF-104",
      activityName: sc.activityName || "Foundation Excavation",
      location: sc.workfront || "Grid A-14",
      discipline: sc.discipline || "Civil & Groundworks",
      workfront: sc.workfront || "Grid A-14",
      state: executionStatus,
      progress: `${quantityProgress}%`,
      date: "Day 14",
      time: "16:42",
      confidence: evalData.confidence,
      margin: evalData.margin,
      contextMatch: evalData.contextMatch,
      evidence: `${evidenceCount} field photographs`,
      issue: sc.reason || (executionStatus === "Blocked" ? "Unexpected buried obstruction" : "Field progress reported"),
      gateRouting: evalData.gateRouting,
      isAutoAccept: evalData.isAutoAccept,
      gateExplanation: evalData.gateExplanation,
      topCandidate: `${evalData.topCandidate.id} (${evalData.topCandidate.name})`,
      secondCandidate: `${evalData.secondCandidate.id} (${evalData.secondCandidate.name})`,
      hardChecks: evalData.hardChecks
    };
    if (onPublish) onPublish(event);
  }, [isDemoProject, project, activeScenarioId, gateScenario, executionStatus, quantityProgress, evidenceCount, onPublish]);

  // Fast skip function for instant demo gratification
  const handleFastComplete = () => {
    publishCurrentEvent(currentScenario);
    setProcessingStep(10);
    setProcessing(false);
  };

  // Run pipeline processing with a smooth non-blocking step timer
  useEffect(() => {
    if (!processing) return;

    let step = 1;
    const interval = setInterval(() => {
      step += 1;
      if (step <= 10) {
        setProcessingStep(step);
      } else {
        clearInterval(interval);
        publishCurrentEvent();
        setProcessing(false);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [processing, publishCurrentEvent]);

  return (
    <section className="content domain-page">
      <div className="domain-shell">
        {/* TOP STATUS BAR */}
        <div className="domain-top-status-bar">
          <div className="status-item">
            <span className="status-kicker">PROJECT</span>
            <strong>{project?.name || "ALPHA FACILITY PHASE 2"}</strong>
          </div>
          <div className="status-divider"></div>
          <div className="status-item">
            <span className="status-kicker">DOMAIN SUPERVISOR</span>
            <strong>{project?.supervisor?.name || "ARJUN SHARMA"}</strong>
          </div>
          <div className="status-divider"></div>
          <div className="status-item">
            <span className="status-kicker">WORKFRONT</span>
            <strong>{project?.supervisor?.assignedWorkfront || "GRID A-14 · SUBSTRUCTURE"}</strong>
          </div>
          <div className="status-divider"></div>
          <div className="status-item">
            <span className="status-kicker">STATUS DATE</span>
            <strong className="active-green">{project?.statusDate || "DAY 14 · SHIFT A"}</strong>
          </div>
        </div>

        {/* WORKSPACE TITLE ROW */}
        <div className="supervisor-header-row">
          <div>
            <p className="section-kicker">FIELD EXECUTION ENTRY</p>
            <h2>Domain Supervisor · Daily Field Report</h2>
            <p className="workspace-sub">
              Log daily site observations and ground reality without manual schedule entry.
            </p>
          </div>

          <div className="action-buttons-group">
            <button
              type="button"
              className="action-btn-outline"
              onClick={() => {
                setSubmitted(false);
                setProcessing(false);
                setProcessingStep(0);
              }}
            >
              <span>↺</span> New Report
            </button>
            <button
              type="button"
              className="action-btn-primary"
              onClick={handleFastComplete}
            >
              <span>⚡</span> Fast Complete Demo
            </button>
          </div>
        </div>

        {!submitted ? (
          <div className="supervisor-field-layout">
          {/* LEFT COLUMN: LOW FRICTION FIELD ENTRY */}
          <div className="field-entry-column">
            {/* CONTEXT CHIP / WORKFRONT AUTO-ATTACH */}
            <div className="context-banner-card">
              <div className="context-card-header">
                <div>
                  <span className="mini-kicker">AUTO-POPULATED CONTEXT</span>
                  <h4>Assigned Workfront & Expected Activity</h4>
                </div>
                <span className="verified-badge">SYSTEM LINKED</span>
              </div>

              <div className="context-items-list">
                <div className="context-item-row">
                  <div className="item-icon-box">📍</div>
                  <div>
                    <span className="item-sub">LOCATION / WORKFRONT</span>
                    <strong>{project?.supervisor?.assignedWorkfront || "Grid A-14: Foundation Pit Substructure"}</strong>
                  </div>
                </div>

                <div className="context-item-row">
                  <div className="item-icon-box">📅</div>
                  <div>
                    <span className="item-sub">SCHEDULED ACTIVITY</span>
                    <strong>
                      {isDemoProject
                        ? "CF-104: Foundation Excavation (60-70% window)"
                        : `${project?.activities?.[2]?.id || "SP-204"}: ${project?.activities?.[2]?.name || "PV Module Stringing"} (Active)`}
                    </strong>
                  </div>
                  <span className="task-status-pill in-progress">ACTIVE TODAY</span>
                </div>

                <div className="context-item-row">
                  <div className="item-icon-box">🔗</div>
                  <div>
                    <span className="item-sub">SUCCESSOR DEPENDENCY</span>
                    <strong>
                      {isDemoProject
                        ? "CF-108: Foundation Pour & Curing (Starts upon CF-104 completion)"
                        : `${project?.activities?.[3]?.id || "SP-208"}: ${project?.activities?.[3]?.name || "Inverter Station Hookup"}`}
                    </strong>
                  </div>
                  <span className="task-status-pill pending">
                    {isDemoProject ? "PENDING CLEARANCE" : "SCHEDULED"}
                  </span>
                </div>
              </div>
            </div>

            {/* QUICK PRESET SCENARIO SELECTOR - SCOPED EXCLUSIVELY TO DEMO PROJECTS */}
            {isDemoProject && (
              <div className="quick-presets-section">
                <span className="presets-title">PHASE 2 INTERACTIVE DEMO SCENARIOS:</span>
                <div className="preset-buttons-grid">
                  {DEMO_SCENARIOS.map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      className={`preset-btn ${activeScenarioId === sc.id ? "active" : ""}`}
                      onClick={() => {
                        if (onSelectScenario) onSelectScenario(sc.id);
                        setReportNote(sc.reportText);
                        setExecutionStatus(sc.newStatus);
                        setQuantityProgress(sc.quantityProgress);
                        setEvidenceCount(sc.evidenceCount);
                        setGateScenario(sc.id === "ambiguous-civil" ? "ambiguity" : "auto-accept");
                      }}
                    >
                      <span className="preset-icon">{sc.badgeType === "danger" ? "⚡" : sc.badgeType === "warning" ? "⏳" : "⚠️"}</span>
                      <div>
                        <strong>{sc.name}</strong>
                        <small>{sc.workfront} · {sc.badge}</small>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* NATURAL LANGUAGE OBSERVATION INPUT */}
            <div className="natural-input-section">
              <div className="input-header-bar">
                <label htmlFor="supervisor-report-textarea" className="input-field-label">
                  DAILY FIELD OBSERVATION (PLAIN FIELD LANGUAGE)
                </label>
                <button
                  type="button"
                  className={`voice-record-btn ${isRecording ? "recording-pulse" : ""}`}
                  onClick={toggleRecording}
                >
                  <span className="mic-indicator">●</span>
                  <span>{isRecording ? "Listening to site audio (2.2s)..." : "Voice Memo / Audio Dictate"}</span>
                </button>
              </div>

              <textarea
                id="supervisor-report-textarea"
                className="supervisor-textarea"
                rows="4"
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                placeholder="Describe actual field work, hindrances, or progress in normal supervisor language..."
              />
            </div>

            {/* OPTIONAL QUANTITY & STATUS TOGGLE CONTROLS */}
            <div className="optional-controls-row">
              <div className="optional-control-item">
                <label>
                  <span>OPTIONAL QUANTITY / PROGRESS</span>
                  <strong>{quantityProgress}% ({Math.round((quantityProgress / 100) * 17.5)}m / 17.5m)</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={quantityProgress}
                  onChange={(e) => setQuantityProgress(Number(e.target.value))}
                  className="progress-slider"
                />
              </div>

              <div className="optional-control-item">
                <label>
                  <span>OPTIONAL EXECUTION STATUS</span>
                  <strong>{executionStatus}</strong>
                </label>
                <div className="status-pill-selector">
                  {["In Progress", "Blocked", "Completed"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`status-chip ${executionStatus === st ? `selected ${st.toLowerCase().replace(" ", "-")}` : ""}`}
                      onClick={() => setExecutionStatus(st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* EVIDENCE & ATTACHMENT SECTION WITH "Add Evidence" BUTTON */}
            <div className="evidence-attachment-bar">
              <div className="evidence-info">
                <div className="evidence-icon">📷</div>
                <div>
                  <strong>Workfront Photographic Evidence</strong>
                  <p>
                    {evidenceAttached
                      ? `${evidenceCount} geo-tagged photos attached · ${project?.supervisor?.assignedWorkfront || "Grid A-14"} · ${project?.statusDate || "16:42 IST"}`
                      : "No evidence currently attached (reduces Evidence Cross-Check score)"}
                  </p>
                </div>
              </div>

              <div className="evidence-buttons">
                <button
                  id="btn-add-evidence"
                  type="button"
                  className={`evidence-action-btn ${evidenceAttached ? "has-files" : ""}`}
                  onClick={() => {
                    setEvidenceAttached(!evidenceAttached);
                    setEvidenceCount(evidenceAttached ? 0 : 4);
                  }}
                >
                  <span className="btn-icon">＋</span>
                  Add Evidence
                </button>
              </div>
            </div>

            {/* PRIMARY SUBMIT BUTTON */}
            <div className="submission-action-bar">
              <button
                id="btn-submit-report"
                type="button"
                className="submit-report-cta"
                onClick={() => {
                  setSubmitted(true);
                  setProcessing(true);
                  setProcessingStep(1);
                  setHumanActionStatus(null);
                }}
              >
                <span>Submit Report to Execution Truth Pipeline</span>
                <span className="cta-arrow">→</span>
              </button>
              <div className="submission-guarantee">
                <span>🛡 Part V Dual-Score Verification</span>
                <span>•</span>
                <span>Auto-accepts routine reports without forcing supervisor confirmation</span>
              </div>
            </div>
          </div>

          {/* RIGHT: ARCHITECTURAL PIPELINE PREVIEW & EXPLAINER */}
          <div className="pipeline-preview-card">
            <div className="panel-header">
              <div>
                <p className="section-kicker">SYNCRA MASTER ARCHITECTURE</p>
                <h3>10-Stage Trust Pipeline</h3>
              </div>
              <span className="spec-ref-pill">Part V §23</span>
            </div>

            <p className="pipeline-summary-note">
              Raw field input is never written directly to the CPM schedule. It is progressively verified through independent corroboration layers:
            </p>

            <div className="pipeline-mini-steps">
              {PIPELINE_STAGES.map((st, i) => (
                <div key={st.id} className="mini-pipeline-item">
                  <div className="mini-step-num">{String(i + 1).padStart(2, "0")}</div>
                  <div className="mini-step-text">
                    <strong>{st.name}</strong>
                    <small>{st.short}</small>
                  </div>
                  <span className="mini-arrow">›</span>
                </div>
              ))}
            </div>

            <div className="gate-preview-box">
              <span className="box-kicker">AUTOMATION GATE RULE (PART V §31)</span>
              <code>
                Confidence ≥ 90%<br />
                AND Context Match ≥ 90%<br />
                AND Candidate Margin ≥ 15 pp<br />
                AND No Hard Check Violation<br />
                <strong>➔ AUTO-ACCEPT</strong>
              </code>
            </div>
          </div>
        </div>
      ) : (
        /* ====================================================================
           2. LIVE 10-STAGE PIPELINE & VERIFIED EXECUTION EVENT RESULTS
           ==================================================================== */
        <div className="verification-execution-container">
          {/* VISUAL 10-STAGE PIPELINE PROGRESS RAIL (Part V, Section 23) */}
          <div className="pipeline-tracker-card">
            <div className="tracker-top-meta">
              <div className="tracker-title-group">
                <span className="stage-eyebrow">SYNCRA EXECUTION TRUTH PIPELINE</span>
                <h3>10-Stage Verification Flow</h3>
              </div>
              <div className="tracker-status-indicator">
                {processing ? (
                  <span className="processing-pill">
                    <span className="spin-icon">↻</span> STAGE {processingStep} OF 10: {PIPELINE_STAGES[processingStep - 1]?.short || "STARTING..."}
                  </span>
                ) : (
                  <span className="completed-pill">
                    ✓ PIPELINE EXECUTED · 10/10 STAGES PROCESSED
                  </span>
                )}
              </div>
            </div>

            {/* VISUAL 10-STAGE RIBBON */}
            <div className="pipeline-ribbon">
              {PIPELINE_STAGES.map((stage, idx) => {
                const stageNum = idx + 1;
                const isCurrent = processing && processingStep === stageNum;
                const isPassed = !processing || processingStep > stageNum;
                return (
                  <div
                    key={stage.id}
                    className={`pipeline-stage-node ${isPassed ? "stage-passed" : ""} ${isCurrent ? "stage-active" : ""}`}
                    title={stage.name}
                  >
                    <div className="stage-node-icon">
                      {isPassed ? "✓" : isCurrent ? stage.icon : stageNum}
                    </div>
                    <div className="stage-node-details">
                      <span className="stage-node-index">{String(stageNum).padStart(2, "0")}</span>
                      <strong className="stage-node-name">{stage.short}</strong>
                    </div>
                    {idx < PIPELINE_STAGES.length - 1 && <div className="stage-connector"></div>}
                  </div>
                );
              })}
            </div>
          </div>

          {processing ? (
            /* PROCESSING ENGINE ANIMATION */
            <div className="processing-live-card">
              <div className="engine-live-header">
                <div className="pulsing-logo">S</div>
                <div>
                  <h4>Executing Automated Verification Pipeline...</h4>
                  <p>
                    Corroborating field language against project vocabulary, WBS L5/L6 schedule graph, and multi-signal evidence.
                  </p>
                </div>
                <button
                  id="btn-fast-complete"
                  type="button"
                  className="fast-complete-btn"
                  onClick={handleFastComplete}
                >
                  Skip to Results ➔
                </button>
              </div>

              <div className="active-stage-display">
                <div className="stage-progress-bar">
                  <div
                    className="stage-progress-fill"
                    style={{ width: `${Math.max(10, processingStep * 10)}%` }}
                  ></div>
                </div>
                <div className="stage-status-row">
                  <span className="stage-counter">Step {processingStep || 1} / 10</span>
                  <strong className="stage-name-focus">
                    {PIPELINE_STAGES[(processingStep || 1) - 1]?.name}
                  </strong>
                  <span className="stage-pct">{processingStep * 10}%</span>
                </div>
              </div>
            </div>
          ) : (
            /* VERIFIED RESULTS & INSPECTION VIEW */
            <>
              {/* DUAL-SCORE + CANDIDATE MARGIN + HARD CHECKS METRICS BAR */}
              <div className="scores-metrics-grid">
                {/* 1. CONFIDENCE SCORE (Identity) */}
                <div className="score-card confidence-card">
                  <div className="score-header">
                    <span className="score-label">CONFIDENCE SCORE</span>
                    <span className="score-tag">Identity</span>
                  </div>
                  <div className="score-number-row">
                    <span className="score-hero">{currentScenario.confidence}%</span>
                    <span className="score-badge pass">≥90% TARGET MET</span>
                  </div>
                  <p className="score-desc">
                    Field language & vocabulary match to schedule activity <strong>{currentScenario.topCandidate.split(" ")[0]}</strong>
                  </p>
                </div>

                {/* 2. CANDIDATE MARGIN */}
                <div className="score-card margin-card">
                  <div className="score-header">
                    <span className="score-label">CANDIDATE MARGIN</span>
                    <span className="score-tag">Disambiguation</span>
                  </div>
                  <div className="score-number-row">
                    <span className={`score-hero ${currentScenario.margin >= 15 ? "margin-high" : "margin-low"}`}>
                      +{currentScenario.margin} pp
                    </span>
                    <span className={`score-badge ${currentScenario.margin >= 15 ? "pass" : "warn"}`}>
                      {currentScenario.margin >= 15 ? "≥15 pp SEPARATION" : "AMBIGUITY (<15 pp)"}
                    </span>
                  </div>
                  <p className="score-desc">
                    Top ({currentScenario.topScore}%) vs 2nd candidate ({currentScenario.secondScore}%)
                  </p>
                </div>

                {/* 3. CONTEXT MATCH SCORE (Plausibility) */}
                <div className="score-card context-card">
                  <div className="score-header">
                    <span className="score-label">CONTEXT MATCH SCORE</span>
                    <span className="score-tag">Schedule Plausibility</span>
                  </div>
                  <div className="score-number-row">
                    <span className="score-hero">{currentScenario.contextMatch}%</span>
                    <span className={`score-badge ${currentScenario.contextMatch >= 90 ? "pass" : "warn"}`}>
                      {currentScenario.contextMatch >= 90 ? "≥90% CONSISTENT" : "MISMATCH (<90%)"}
                    </span>
                  </div>
                  <p className="score-desc">
                    CPM early dates, float, dependency logic & resource availability
                  </p>
                </div>

                {/* 4. CROSS-VALIDATION / HARD CHECKS */}
                <div className="score-card checks-card">
                  <div className="score-header">
                    <span className="score-label">HARD CHECKS / VETO</span>
                    <span className="score-tag">Part V §30</span>
                  </div>
                  <div className="score-number-row">
                    <span className={`score-hero ${currentScenario.hardCheckPass ? "check-pass" : "check-fail"}`}>
                      {currentScenario.hardCheckPass ? "CONSISTENT" : "VETO / FAIL"}
                    </span>
                    <span className={`score-badge ${currentScenario.hardCheckPass ? "pass" : "fail"}`}>
                      {currentScenario.hardCheckPass ? "ALL PASS" : "CONTRADICTION"}
                    </span>
                  </div>
                  <p className="score-desc">
                    CPM, dependencies, location/workfront, resources, evidence: <strong>consistent</strong>
                  </p>
                </div>
              </div>

              {/* AUTOMATION GATE BANNER & DECISION */}
              <div className={`automation-gate-banner ${currentScenario.gateClass}`}>
                <div className="gate-icon-badge">
                  {currentScenario.gateRouting === "AUTO-ACCEPT" ? "✓" : "⚠"}
                </div>
                <div className="gate-content">
                  <div className="gate-meta-row">
                    <span className="gate-status-pill">{currentScenario.gateRouting}</span>
                    <span className="gate-rule-name">DUAL-SCORE AUTOMATION GATE (PART V §31)</span>
                  </div>
                  <h3 className="gate-headline">
                    {currentScenario.gateRouting === "AUTO-ACCEPT"
                      ? "Execution Event Automatically Accepted & Verified"
                      : currentScenario.gateRouting === "MANDATORY REVIEW"
                      ? "Material Contradiction Detected — Mandatory Review"
                      : currentScenario.gateRouting === "REVIEW"
                      ? "Routed to Human Review Queue"
                      : "Unresolved — Manual Attachment Required"}
                  </h3>
                  <p className="gate-reason">{currentScenario.gateExplanation}</p>
                  <div className="gate-action-statement">
                    <strong>SYSTEM ACTION:</strong> <span>{currentScenario.systemAction}</span>
                  </div>
                </div>

                {currentScenario.gateRouting === "AUTO-ACCEPT" && (
                  <div className="auto-accept-stamp">
                    <span className="stamp-icon">🛡</span>
                    <span className="stamp-title">ROUTINELY VERIFIED</span>
                    <small>No manual confirmation forced on supervisor</small>
                  </div>
                )}
              </div>

              {/* DEMO SCENARIO SWITCHER (Allows exploring all gate branches) */}
              <div className="scenario-switcher-bar">
                <span className="switcher-label">TEST GATE LOGIC BRANCHES:</span>
                <div className="switcher-chips">
                  <button
                    type="button"
                    className={`switcher-chip ${gateScenario === "auto-accept" ? "active" : ""}`}
                    onClick={() => {
                      setGateScenario("auto-accept");
                      setHumanActionStatus(null);
                    }}
                  >
                    ★ Auto-Accept (94% / +33 pp / 96%)
                  </button>

                  <button
                    type="button"
                    className={`switcher-chip ${gateScenario === "ambiguity" ? "active" : ""}`}
                    onClick={() => {
                      setGateScenario("ambiguity");
                      setHumanActionStatus(null);
                    }}
                  >
                    Ambiguity (Margin +4 pp)
                  </button>

                  <button
                    type="button"
                    className={`switcher-chip ${gateScenario === "context-mismatch" ? "active" : ""}`}
                    onClick={() => {
                      setGateScenario("context-mismatch");
                      setHumanActionStatus(null);
                    }}
                  >
                    Context Mismatch (81%)
                  </button>

                  <button
                    type="button"
                    className={`switcher-chip ${gateScenario === "contradiction" ? "active" : ""}`}
                    onClick={() => {
                      setGateScenario("contradiction");
                      setHumanActionStatus(null);
                    }}
                  >
                    Contradiction (Hard Veto)
                  </button>

                  <button
                    type="button"
                    className={`switcher-chip ${gateScenario === "unresolved" ? "active" : ""}`}
                    onClick={() => {
                      setGateScenario("unresolved");
                      setHumanActionStatus(null);
                    }}
                  >
                    Unresolved (&lt;75%)
                  </button>
                </div>
              </div>

              {/* VISIBLY PRESENT INSPECTION BUTTONS BAR */}
              <div className="inspection-tabs-bar">
                <div className="tab-buttons-group">
                  <button
                    id="btn-view-extracted-data"
                    type="button"
                    className={`inspection-tab-btn ${activeTab === "extracted" ? "active" : ""}`}
                    onClick={() => setActiveTab("extracted")}
                  >
                    <span className="tab-icon">▤</span>
                    View Extracted Data
                  </button>

                  <button
                    id="btn-view-match"
                    type="button"
                    className={`inspection-tab-btn ${activeTab === "match" ? "active" : ""}`}
                    onClick={() => setActiveTab("match")}
                  >
                    <span className="tab-icon">◈</span>
                    View Match
                  </button>

                  <button
                    id="btn-view-context-checks"
                    type="button"
                    className={`inspection-tab-btn ${activeTab === "context" ? "active" : ""}`}
                    onClick={() => setActiveTab("context")}
                  >
                    <span className="tab-icon">🛡</span>
                    View Context/Checks
                  </button>

                  <button
                    id="btn-view-evidence"
                    type="button"
                    className={`inspection-tab-btn ${activeTab === "evidence" ? "active" : ""}`}
                    onClick={() => setActiveTab("evidence")}
                  >
                    <span className="tab-icon">📷</span>
                    View Evidence
                  </button>
                </div>

                <span className="inspection-status-pill">
                  Tab: {activeTab.toUpperCase()}
                </span>
              </div>

              {/* INSPECTION CONTENT PANELS */}
              <div className="inspection-panel-body">
                {/* 1. EXTRACTED DATA VIEW */}
                {activeTab === "extracted" && (
                  <div className="tab-pane-card extracted-pane">
                    <div className="pane-header">
                      <div>
                        <span className="pane-kicker">STAGE 03 · STRUCTURED EXECUTION EVENT</span>
                        <h4>Normalized Field Event Schema ({isDemoProject ? "EV-014" : "EV-042"})</h4>
                      </div>
                      <span className="fields-count-badge">8 Parameters Extracted</span>
                    </div>

                    <div className="schema-grid">
                      <div className="schema-cell">
                        <span className="schema-k">EVENT ID</span>
                        <strong className="schema-v">{isDemoProject ? "EV-014" : "EV-042"}</strong>
                      </div>
                      <div className="schema-cell">
                        <span className="schema-k">PROJECT</span>
                        <strong className="schema-v">{project?.name || "Alpha Facility Phase 2"}</strong>
                      </div>
                      <div className="schema-cell">
                        <span className="schema-k">DOMAIN</span>
                        <strong className="schema-v">{isDemoProject ? "Civil & Groundworks" : (project?.activities?.[2]?.discipline || "Solar EPC")}</strong>
                      </div>
                      <div className="schema-cell">
                        <span className="schema-k">WORKFRONT</span>
                        <strong className="schema-v">{project?.supervisor?.assignedWorkfront || "Grid A-14 (Substructure Sector)"}</strong>
                      </div>
                      <div className="schema-cell">
                        <span className="schema-k">SCHEDULE ACTIVITY</span>
                        <strong className="schema-v highlight">
                          {isDemoProject ? (currentScenario?.topCandidate || "CF-104 · Foundation Excavation") : `${project?.activities?.[2]?.id || "SP-204"} · ${project?.activities?.[2]?.name || "PV Module Stringing & Cabling"}`}
                        </strong>
                      </div>
                      <div className="schema-cell">
                        <span className="schema-k">EXECUTION STATUS</span>
                        <strong className={`schema-v ${executionStatus === "Blocked" ? "text-danger" : "text-success"}`}>
                          {executionStatus}
                        </strong>
                      </div>
                      <div className="schema-cell">
                        <span className="schema-k">ATOMIC PROGRESS</span>
                        <strong className="schema-v">{quantityProgress}% ({Math.round((quantityProgress / 100) * 17.5)}m of 17.5m completed)</strong>
                      </div>
                      <div className="schema-cell">
                        <span className="schema-k">ASSIGNED RESOURCE</span>
                        <strong className="schema-v">{isDemoProject ? "Excavator EX-07 (Civil Crew #1)" : "PV Stringing Rig #4 (Electrical Crew #2)"}</strong>
                      </div>
                    </div>

                    <div className="schema-observation-full">
                      <span className="schema-k">RAW OBSERVATION NOTE</span>
                      <p className="schema-v-text">&ldquo;{reportNote}&rdquo;</p>
                    </div>
                  </div>
                )}

                {/* 2. MATCH & CANDIDATES VIEW */}
                {activeTab === "match" && (
                  <div className="tab-pane-card match-pane">
                    <div className="pane-header">
                      <div>
                        <span className="pane-kicker">STAGE 04 & 05 · CANDIDATE GENERATION & CONFIDENCE</span>
                        <h4>Schedule Activity Candidate Ranking & Separation</h4>
                      </div>
                      <span className="margin-indicator-pill">Margin: +{currentScenario.margin} pp</span>
                    </div>

                    <div className="candidates-table-wrap">
                      <table className="candidates-table">
                        <thead>
                          <tr>
                            <th>RANK</th>
                            <th>ACTIVITY CODE & NAME</th>
                            <th>WBS NODE</th>
                            <th>SEMANTIC SIMILARITY</th>
                            <th>SCORE</th>
                            <th>SEPARATION</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="candidate-row top-candidate">
                            <td>
                              <span className="rank-badge rank-1">#1 Top</span>
                            </td>
                            <td>
                              <strong>{currentScenario.topCandidate}</strong>
                              <small>Grid A-14 · Primary foundation trench</small>
                            </td>
                            <td><code>1.2.1.04</code></td>
                            <td>0.96 (Approved Alias Match)</td>
                            <td>
                              <strong className="score-val top">{currentScenario.topScore}%</strong>
                            </td>
                            <td>
                              <span className="margin-badge strong">+{currentScenario.margin} pp</span>
                            </td>
                          </tr>

                          <tr className="candidate-row second-candidate">
                            <td>
                              <span className="rank-badge rank-2">#2 Next</span>
                            </td>
                            <td>
                              <strong>{currentScenario.secondCandidate}</strong>
                              <small>Grid A-12 to A-14 peripheral storm run</small>
                            </td>
                            <td><code>1.2.1.09</code></td>
                            <td>0.62 (Partial entity overlap)</td>
                            <td>
                              <strong className="score-val second">{currentScenario.secondScore}%</strong>
                            </td>
                            <td>
                              <span className="ref-val">Baseline Reference</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="candidate-logic-box">
                      <strong>Candidate Separation Rationale (Part V §29):</strong>
                      <p>
                        {currentScenario.margin >= 15
                          ? `Top candidate CF-104 exceeds second candidate by +${currentScenario.margin} pp (threshold ≥15 pp). High separation confirms unambiguous activity identity without confusing adjacent civil packages.`
                          : `Top candidate margin (+${currentScenario.margin} pp) is below 15 pp threshold. Although both scores are high, ambiguous activity mapping prevents automatic acceptance.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. CONTEXT & CHECKS VIEW */}
                {activeTab === "context" && (
                  <div className="tab-pane-card context-pane">
                    <div className="pane-header">
                      <div>
                        <span className="pane-kicker">STAGE 06 & 07 · CONTEXT MATCH & HARD CHECKS</span>
                        <h4>Living Execution Graph & Deterministic Veto Conditions</h4>
                      </div>
                      <span className="checks-count-pill">5 / 5 Consistency Checks Evaluated</span>
                    </div>

                    <div className="checks-list">
                      <div className="check-detail-row">
                        <div className="check-status-icon pass">✓</div>
                        <div className="check-detail-content">
                          <div className="check-title-row">
                            <strong>CPM Schedule Position Check</strong>
                            <span className="check-result pass">{currentScenario.cpmCheck}</span>
                          </div>
                          <p>
                            {isDemoProject
                              ? "CF-104 is within active Early Start (ES: Day 12) / Early Finish (EF: Day 16) window. Total float: 4 days."
                              : `${project?.activities?.[2]?.id || "SP-204"} is within active Early Start (Day 36) / Early Finish (Day 49) window. Active critical chain.`}
                          </p>
                        </div>
                      </div>

                      <div className="check-detail-row">
                        <div className="check-status-icon pass">✓</div>
                        <div className="check-detail-content">
                          <div className="check-title-row">
                            <strong>Predecessor & Successor Dependency Network</strong>
                            <span className="check-result pass">{currentScenario.depCheck}</span>
                          </div>
                          <p>
                            {isDemoProject
                              ? "Predecessor CF-101 (Site Clearing) completed Day 11. Downstream successor CF-105 (Rebar Cage) awaiting trench excavation sign-off."
                              : "Predecessor SP-201 (Tracker Assembly) completed Day 35. Downstream successor SP-208 (Inverter Hookup) scheduled upon stringing completion."}
                          </p>
                        </div>
                      </div>

                      <div className="check-detail-row">
                        <div className={`check-status-icon ${currentScenario.materialContradiction ? "fail" : "pass"}`}>
                          {currentScenario.materialContradiction ? "✕" : "✓"}
                        </div>
                        <div className="check-detail-content">
                          <div className="check-title-row">
                            <strong>Location / Workfront Geo-Fence</strong>
                            <span className={`check-result ${currentScenario.materialContradiction ? "fail" : "pass"}`}>
                              {currentScenario.locCheck}
                            </span>
                          </div>
                          <p>
                            {isDemoProject
                              ? "Cross-referenced against supervisor login context and mobile GPS telemetry (Grid A-14, Package 2)."
                              : `Cross-referenced against supervisor login context and mobile GPS telemetry (${project?.location || "Bikaner, Rajasthan"}).`}
                          </p>
                        </div>
                      </div>

                      <div className="check-detail-row">
                        <div className="check-status-icon pass">✓</div>
                        <div className="check-detail-content">
                          <div className="check-title-row">
                            <strong>Resource Allocation Consistency</strong>
                            <span className="check-result pass">{currentScenario.resCheck}</span>
                          </div>
                          <p>
                            {isDemoProject
                              ? "Excavator EX-07 rostered and verified on duty at Grid A-14 during 16:42 time window."
                              : "PV Stringing Rig #4 rostered and verified on duty at Block C-08 during active shift."}
                          </p>
                        </div>
                      </div>

                      <div className="check-detail-row">
                        <div className="check-status-icon pass">✓</div>
                        <div className="check-detail-content">
                          <div className="check-title-row">
                            <strong>Photographic / Evidence Corroboration</strong>
                            <span className="check-result pass">{currentScenario.eviCheck}</span>
                          </div>
                          <p>
                            {isDemoProject
                              ? "Photographic evidence depicts exposed concrete obstruction blocking trench excavation bucket path."
                              : "Photographic evidence depicts active PV module stringing & cabling on Block C-08 tracker rows."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. EVIDENCE VIEW */}
                {activeTab === "evidence" && (
                  <div className="tab-pane-card evidence-pane">
                    <div className="pane-header">
                      <div>
                        <span className="pane-kicker">STAGE 07 · ATTACHED WORKFRONT EVIDENCE</span>
                        <h4>Field Photography & Sensor Metadata</h4>
                      </div>
                      <span className="evidence-provenance-badge">4 Files · GPS Tagged</span>
                    </div>

                    <div className="evidence-grid-display">
                      <div className="evidence-card-preview">
                        <div className="preview-image-box">
                          <div className="photo-placeholder">
                            <span className="cam-glyph">📷</span>
                            <span className="photo-caption">{isDemoProject ? "Grid A-14 Trench Obstruction" : "Block C-08 Tracker Array"}</span>
                          </div>
                          <span className="photo-tag">IMG_2026_0914_01</span>
                        </div>
                        <div className="preview-meta">
                          <strong>{isDemoProject ? "Buried Concrete Footing" : "PV Module Stringing Assembly"}</strong>
                          <small>{isDemoProject ? "16:42:18 IST · EX-07 bucket contact" : `${project?.statusDate || "Day 42"} · Rig #4 stringing active`}</small>
                        </div>
                      </div>

                      <div className="evidence-card-preview">
                        <div className="preview-image-box">
                          <div className="photo-placeholder">
                            <span className="cam-glyph">📷</span>
                            <span className="photo-caption">{isDemoProject ? "Trench Depth Gauge (4.2m Mark)" : "Inverter Foundation Pad Mark"}</span>
                          </div>
                          <span className="photo-tag">IMG_2026_0914_02</span>
                        </div>
                        <div className="preview-meta">
                          <strong>{isDemoProject ? "Excavation Depth Gauge" : "Inverter Station Foundation Pad"}</strong>
                          <small>{isDemoProject ? "Progress: 62% at refusal zone" : "Progress: 46% per baseline milestone plan"}</small>
                        </div>
                      </div>

                      <div className="evidence-card-preview">
                        <div className="preview-image-box">
                          <div className="photo-placeholder">
                            <span className="cam-glyph">📷</span>
                            <span className="photo-caption">{isDemoProject ? "Excavator EX-07 Position" : "Array Stringing Rig #4 Position"}</span>
                          </div>
                          <span className="photo-tag">IMG_2026_0914_03</span>
                        </div>
                        <div className="preview-meta">
                          <strong>{isDemoProject ? "Machine Telemetry Corroboration" : "Stringing Rig Telemetry"}</strong>
                          <small>{isDemoProject ? "EX-07 stationed at Grid A-14 North" : "Rig #4 stationed at Block C-08 East"}</small>
                        </div>
                      </div>

                      <div className="evidence-card-preview">
                        <div className="preview-image-box">
                          <div className="photo-placeholder">
                            <span className="cam-glyph">📷</span>
                            <span className="photo-caption">{isDemoProject ? "Workfront Boundary Overview" : "Solar Array Perimeter Overview"}</span>
                          </div>
                          <span className="photo-tag">IMG_2026_0914_04</span>
                        </div>
                        <div className="preview-meta">
                          <strong>{isDemoProject ? "Grid A-14 Substructure Panorama" : `${project?.location?.split(",")?.[0] || "Bikaner"} Solar Array Boundary`}</strong>
                          <small>{isDemoProject ? "Corroborates shoring & safety perimeter" : "Corroborates stringing corridor & safety envelope"}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* HUMAN ACTION FEEDBACK NOTIFICATION */}
              {humanActionStatus && (
                <div className="human-action-alert">
                  <span className="alert-icon">ℹ</span>
                  <span>{humanActionStatus}</span>
                  <button
                    type="button"
                    className="dismiss-alert"
                    onClick={() => setHumanActionStatus(null)}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* ACTION BAR: VISIBLY PRESENT BUTTONS: APPROVE, CORRECT, REJECT/REVIEW, RETURN */}
              <div className="demo-actions-bottom-bar">
                <div className="action-bar-left">
                  <button
                    id="btn-return"
                    type="button"
                    className="action-btn btn-return"
                    onClick={() => {
                      setSubmitted(false);
                      setProcessingStep(0);
                      setHumanActionStatus(null);
                    }}
                  >
                    ← Return
                  </button>

                  <span className="action-context-hint">
                    {currentScenario.gateRouting === "AUTO-ACCEPT"
                      ? "✓ Routine event auto-accepted to working schedule with zero manual friction."
                      : "⚠ Exception condition: Human supervisory review required to resolve event state."}
                  </span>
                </div>

                <div className="action-bar-right">
                  <button
                    id="btn-approve"
                    type="button"
                    className="action-btn btn-approve"
                    onClick={() => {
                      setHumanActionStatus("✓ Event manually confirmed & approved into project graph by Arjun Sharma (Domain Supervisor).");
                    }}
                  >
                    ✓ Approve
                  </button>

                  <button
                    id="btn-correct"
                    type="button"
                    className="action-btn btn-correct"
                    onClick={() => {
                      setHumanActionStatus("✎ Correction mode opened: Edit quantity progress (currently 62%) or re-assign L5/L6 activity mapping.");
                    }}
                  >
                    ✎ Correct
                  </button>

                  <button
                    id="btn-reject-review"
                    type="button"
                    className="action-btn btn-reject"
                    onClick={() => {
                      setHumanActionStatus("✕ Event routed to Dispute / Conflict Review Queue for Project Planner investigation.");
                    }}
                  >
                    ✕ Reject / Review
                  </button>
                </div>
              </div>

              {/* BRIDGE TO SHARED PROJECT STATE */}
              <div className="publish-sync-footer">
                <div className="publish-pill-left">
                  <span className="sync-icon">⚡</span>
                  <div>
                    <strong>Shared Project State Broadcast: EV-014</strong>
                    <small>Real-time updates broadcast to Project Manager, CPM Critical Path & Recovery Engines</small>
                  </div>
                </div>

                <button
                  type="button"
                  className="quick-return-link"
                  onClick={() => {
                    setSubmitted(false);
                    setProcessingStep(0);
                    setHumanActionStatus(null);
                  }}
                >
                  Return to Daily Field Reports →
                </button>
              </div>
            </>
          )}
        </div>
      )}
      </div>
    </section>
  );
}

function UpdatedStateView({ perturbationResult, project }) {
  const result = perturbationResult || simulateSchedulePerturbation();
  const baselineFinish = project ? project.baselineFinishDay : 30;
  const terminalMilestone = (result?.milestoneExposure && (result.milestoneExposure["M-03"] || result.milestoneExposure["M-04"])) ||
    (result?.milestoneExposure ? Object.values(result.milestoneExposure).sort((a, b) => b.perturbedEF - a.perturbedEF)[0] : null);
  const forecastFinish = terminalMilestone ? terminalMilestone.perturbedEF : baselineFinish + (result?.projectDelayDays || 0);
  const isDelayed = result ? result.isProjectFinishDelayed : false;
  const nodeCount = result?.perturbedActivities?.length || 0;

  return (
    <section className="content">

      <div className="page-intro">
        <p className="section-kicker">STATE UPDATED · DYNAMIC CPM ENGINE</p>

        <h2>Living Schedule vs Approved Baseline</h2>

        <p>
          The dynamic CPM engine recalculates forecast dates while locking the contractually approved baseline.
        </p>
      </div>

      <div className="update-success">
        <div className="success-mark">✓</div>

        <div>
          <span>RECOVERY ORIENTATION</span>
          <strong>{isDelayed ? `Variance Managed: +${result.projectDelayDays}d Delay` : "Variance Absorbed: On Schedule"}</strong>
          <p>Approved baseline locked · Working plan active</p>
        </div>

        <div className="approved-badge">
          ACTIVE STATE
        </div>
      </div>

      <div className="state-update-grid">

        <div className="update-card">
          <p className="section-kicker">SCHEDULE STATE</p>

          <h3>Current working forecast</h3>

          <div className="forecast-comparison">
            <div>
              <span>APPROVED BASELINE</span>
              <strong>Day {baselineFinish}</strong>
            </div>

            <div className="forecast-arrow">→</div>

            <div>
              <span>CURRENT FORECAST</span>
              <strong className={isDelayed ? "red-text" : "green-text"}>
                Day {forecastFinish} {isDelayed ? `(+${result.projectDelayDays}d)` : "(On Time)"}
              </strong>
            </div>
          </div>

          <p>
            {isDelayed
              ? `Downstream critical chain extended. Substantial Completion moves to Day ${forecastFinish}.`
              : "Disruption fully absorbed into available total float buffer without moving the project finish."}
          </p>
        </div>

        <div className="update-card baseline-card">
          <p className="section-kicker">BASELINE CONTROL</p>

          <h3>Approved baseline preserved</h3>

          <div className="baseline-row">
            <span>BASELINE FINISH</span>
            <strong>Day {baselineFinish} (Preserved)</strong>
          </div>

          <div className="baseline-row">
            <span>WORKING PLAN</span>
            <strong className={isDelayed ? "red-text" : "green-text"}>
              Day {forecastFinish}
            </strong>
          </div>

          <div className="baseline-row">
            <span>HISTORICAL ACTUAL</span>
            <strong>Preserved</strong>
          </div>
        </div>

      </div>

      {/* DYNAMIC CPM SCHEDULE STATUS TABLE */}
      <div className="state-schedule-table-card panel" style={{ marginTop: "24px", padding: "20px" }}>
        <div className="panel-header">
          <div>
            <p className="section-kicker">LIVING EPC SCHEDULE STATUS</p>
            <h3>{nodeCount}-Node Schedule Variance Table</h3>
          </div>
          <span className="state-change-tag">TOPOLOGICAL CPM</span>
        </div>

        <div className="table-wrapper" style={{ overflowX: "auto", marginTop: "14px" }}>
          <table className="cpm-comparison-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--syncra-border)", color: "#94a3b8", textAlign: "left" }}>
                <th style={{ padding: "8px" }}>ID</th>
                <th style={{ padding: "8px" }}>ACTIVITY NAME</th>
                <th style={{ padding: "8px" }}>DISCIPLINE</th>
                <th style={{ padding: "8px" }}>BASELINE EF</th>
                <th style={{ padding: "8px" }}>FORECAST EF</th>
                <th style={{ padding: "8px" }}>FLOAT DELTA</th>
                <th style={{ padding: "8px" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {result?.perturbedActivities.map(act => {
                const base = result.baselineActivities.find(b => b.id === act.id);
                const deltaEF = act.earlyFinish - (base?.earlyFinish || act.earlyFinish);
                const deltaTF = act.totalFloat - (base?.totalFloat || act.totalFloat);
                const isDisturbed = act.id === result.disturbance.activityId;

                return (
                  <tr
                    key={act.id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      background: isDisturbed ? "rgba(239, 68, 68, 0.12)" : "transparent"
                    }}
                  >
                    <td style={{ padding: "8px", fontWeight: "700" }}>{act.id}</td>
                    <td style={{ padding: "8px" }}>{act.name}</td>
                    <td style={{ padding: "8px", color: "#94a3b8" }}>{act.discipline}</td>
                    <td style={{ padding: "8px" }}>Day {base?.earlyFinish || act.earlyFinish}</td>
                    <td style={{ padding: "8px", fontWeight: deltaEF > 0 ? "700" : "normal", color: deltaEF > 0 ? "#f87171" : "#e2e8f0" }}>
                      Day {act.earlyFinish} {deltaEF > 0 ? `(+${deltaEF}d)` : ""}
                    </td>
                    <td style={{ padding: "8px", color: deltaTF < 0 ? "#fbbf24" : "#94a3b8" }}>
                      {deltaTF < 0 ? `${deltaTF}d (Eroded)` : `${act.totalFloat}d`}
                    </td>
                    <td style={{ padding: "8px" }}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "700",
                        background: act.isCritical ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.15)",
                        color: act.isCritical ? "#f87171" : "#93c5fd"
                      }}>
                        {act.isCritical ? "CRITICAL" : "NORMAL"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="audit-card" style={{ marginTop: "24px" }}>

        <div>
          <p className="section-kicker">AUDIT TRAIL</p>
          <h3>Decision history preserved</h3>
        </div>

        <div className="audit-events">

          <div>
            <span>{project?.statusDate ? project.statusDate.toUpperCase() : "DAY 14 · 16:42"}</span>
            <strong>{result?.disturbance?.reason || "Field condition captured"}</strong>
            <small>{project?.supervisor?.name ? `${project.supervisor.name} (${project.supervisor.role})` : "Site Supervisor"}</small>
          </div>

          <div>
            <span>{project?.statusDate ? `${project.statusDate.toUpperCase()} · VERIFIED` : "DAY 14 · 18:10"}</span>
            <strong>Execution state verified</strong>
            <small>Domain Supervisor</small>
          </div>

          <div>
            <span>DAY 16</span>
            <strong>Impact identified</strong>
            <small>SYNCRA analysis</small>
          </div>

          <div>
            <span>DAY 16</span>
            <strong>Plan A approved</strong>
            <small>Project manager</small>
          </div>

        </div>
      </div>

      <div className="institutional-memory">

        <div>
          <p className="section-kicker">INSTITUTIONAL MEMORY</p>

          <h3>
            This event becomes project knowledge.
          </h3>

          <p>
            Evidence, state changes, constraints, decisions and outcomes are
            retained so future planning and predictive analysis can use the
            project's actual execution history.
          </p>
        </div>

        <div className="memory-flow">
          <span>PLAN</span>
          <i>→</i>
          <span>REALITY</span>
          <i>→</i>
          <span>DEVIATION</span>
          <i>→</i>
          <span>DECISION</span>
          <i>→</i>
          <span>OUTCOME</span>
        </div>

      </div>

    </section>
  );
}

export default App;