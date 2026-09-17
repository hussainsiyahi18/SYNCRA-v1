import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { getProjectSummary } from "./data/alphaFacilityData";

function App() {
  const [userRole, setUserRole] = useState(null);
  const [view, setView] = useState("overview");
  const [showIntro, setShowIntro] = useState(true);
  const projectSummary = getProjectSummary();

const [executionEvent, setExecutionEvent] = useState(null);
const [incomingEvent, setIncomingEvent] = useState(null);
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
      onLogin={(role) => {
        const normalizedRole = (role || "").trim().toLowerCase();
        setUserRole(normalizedRole);

        if (normalizedRole === "domain") {
          setView("domain");
        } else {
          setView("overview");
        }
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

        <div className="project-switcher">
          <span className="eyebrow">PROJECT</span>
          <div className="project-name">{projectSummary.projectName} {projectSummary.phase}</div>
          <div className="project-meta">{projectSummary.location} · Day {projectSummary.statusDate} ({projectSummary.status})</div>
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
            Projects / Alpha Facility
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
          <div className="status-pill">
            <span className="status-dot"></span>
            Project Active
          </div>

          <button className="notification-button">○</button>
        </div>
      </header>

      <main>
      {view === "overview" ? (
        <section className="content">
          <div className="hero-row">
            <div>
              <p className="section-kicker">CURRENT STATE</p>
              <h2>Attention required</h2>
              <p className="hero-description">
                SYNCRA has identified changes that may affect the current
                project forecast.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() => setView("intelligence")}
            >
              Review intelligence <span>→</span>
            </button>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">PHYSICAL PROGRESS</div>
              <div className="metric-value">68.4%</div>
              <div className="metric-note positive">↑ 3.2% this week</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">CURRENT FORECAST</div>
              <div className="metric-value">+3 days</div>
              <div className="metric-note warning">
                vs approved baseline
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">CRITICAL ACTIVITIES</div>
              <div className="metric-value">{projectSummary.activeCriticalCount}</div>
              <div className="metric-note">2 currently exposed · {projectSummary.activeCriticalPath.slice(0, 3).join(" → ")}...</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">OPEN DECISIONS</div>
              <div className="metric-value">2</div>
              <div className="metric-note">1 requires attention</div>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="panel attention-panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">SIGNAL</p>
                  <h3>Attention required</h3>
                </div>
                <span className="count-badge">03</span>
              </div>

              <div className="attention-item">
                <div className="severity high"></div>
                <div className="attention-content">
                  <div className="attention-title">
                    CF-104 · Unexpected site condition
                  </div>
                  <div className="attention-description">
                    Foundation excavation blocked at Grid A-14.
                  </div>
                  <div className="attention-meta">
                    Potential testing milestone exposure
                  </div>
                </div>
                <span className="arrow">→</span>
              </div>

              <div className="attention-item">
                <div className="severity medium"></div>
                <div className="attention-content">
                  <div className="attention-title">
                    EX-07 · Equipment constraint
                  </div>
                  <div className="attention-description">
                    Excavator unavailable for current workfront.
                  </div>
                  <div className="attention-meta">
                    Resource conflict detected
                  </div>
                </div>
                <span className="arrow">→</span>
              </div>

              <div className="attention-item">
                <div className="severity medium"></div>
                <div className="attention-content">
                  <div className="attention-title">
                    Instrumentation · Readiness gap
                  </div>
                  <div className="attention-description">
                    Calibration remains incomplete.
                  </div>
                  <div className="attention-meta">
                    Integrated testing exposed
                  </div>
                </div>
                <span className="arrow">→</span>
              </div>
            </section>

            <section className="panel forecast-panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">FORECAST</p>
                  <h3>Project timeline</h3>
                </div>
                <span className="muted-label">CURRENT</span>
              </div>

              <div className="timeline">
                <div className="timeline-row">
                  <span className="timeline-label">Baseline</span>
                  <div className="timeline-track">
                    <div className="timeline-baseline"></div>
                    <span className="timeline-date">30 Sep</span>
                  </div>
                </div>

                <div className="timeline-row">
                  <span className="timeline-label">Forecast</span>
                  <div className="timeline-track">
                    <div className="timeline-forecast"></div>
                    <span className="timeline-date">03 Oct</span>
                  </div>
                </div>
              </div>

              <div className="forecast-summary">
                <div>
                  <span className="summary-label">Variance</span>
                  <strong>+3 days</strong>
                </div>

                <div>
                  <span className="summary-label">Confidence</span>
                  <strong>High</strong>
                </div>
              </div>
            </section>
          </div>
        </section>
      ) : view === "intelligence" ? (
        <IntelligenceView
  executionEvent={executionEvent}
  incomingEvent={incomingEvent}
  onBack={() => setView("overview")}
  onImpact={() => setView("impact")}
/>
      ) : view === "impact" ? (
        <ImpactView
          onBack={() => setView("intelligence")}
          onRecovery={() => setView("recovery")}
        />
      ) : view === "recovery" ? (
        <RecoveryView
          onBack={() => setView("impact")}
          onApproved={() => setView("updated")}
        />
      ) : view === "domain" ? (
  <DomainSupervisorView
  onBack={() => setView("domain")}
  onPublish={publishExecutionEvent}
/>
) : (
  <UpdatedStateView />
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
            NETWORK: <b>ALPHA FACILITY (ASSAM)</b>
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

function LoginView({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const MOCK_USERS = {
    manager01: {
      password: "syncra123",
      role: "manager",
    },
    domain01: {
      password: "syncra123",
      role: "domain",
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
    onLogin(user.role);
  };

  return (
    <div className="login-shell">

      <div className="login-card">

        <div className="login-brand">
          <div className="login-brand-mark">
            S
          </div>

          <div>
            <div className="login-brand-name">
              SYNCRA
            </div>

            <div className="login-brand-subtitle">
              Execution Intelligence
            </div>
          </div>
        </div>

        <div className="login-heading">
          <p className="section-kicker">
            ALPHA FACILITY
          </p>

          <h1>
            Sign in to SYNCRA
          </h1>

          <p>
            Access your project workspace.
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleLogin}
        >

          <div className="login-field">
            <label htmlFor="user-id">
              USER ID
            </label>

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
            <label htmlFor="password">
              PASSWORD
            </label>

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

          <button
            className="login-button"
            type="submit"
          >
            Sign in <span>→</span>
          </button>

        </form>

        <div className="login-quick-roles">
          <span className="section-kicker">QUICK SIGN-IN FOR DEMO</span>
          <div className="quick-role-buttons">
            <button
              type="button"
              className="quick-role-btn"
              onClick={() => onLogin("manager")}
            >
              <span>👔</span>
              <div>
                <strong>Project Manager</strong>
                <small>Ravi Mehta (Overview, CPM)</small>
              </div>
            </button>
            <button
              type="button"
              className="quick-role-btn"
              onClick={() => onLogin("domain")}
            >
              <span>🏗️</span>
              <div>
                <strong>Domain Supervisor</strong>
                <small>Arjun Sharma (Field Reports)</small>
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
  onBack,
  onImpact,
}) {
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
          <h2>Foundation excavation blocked</h2>
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
              “Excavation halted at approximately 1.8m depth.
              Concrete structure encountered at Grid A-14.”
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
                <strong className="amber-text">1 day</strong>
              </div>

              <div>
                <span>EQUIPMENT</span>
                <strong>EX-07</strong>
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
                <strong>CF-103 · Completed</strong>
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
                <strong>MF-218 · Not Started</strong>
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
                  <strong>EX-07 Excavator</strong>
                  <p>Repair in progress · available Day 17</p>
                </div>
              </div>

              <div className="context-item">
                <div className="context-icon weather">W</div>

                <div>
                  <span>WEATHER</span>
                  <strong>Heavy rainfall</strong>
                  <p>Wet ground · productivity impact likely</p>
                </div>
              </div>

              <div className="context-item">
                <div className="context-icon dependency">D</div>

                <div>
                  <span>DEPENDENCY</span>
                  <strong>MF-218 Equipment Foundation</strong>
                  <p>Not started · successor exposed</p>
                </div>
              </div>
            </div>

            <div className="context-summary">
              <span>COMBINED SIGNAL</span>

              <strong>
                Resource constraint + site condition + low float increase
                exposure
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
                    <strong>{executionEvent.activity}</strong>
                    <small>{executionEvent.state}</small>
                  </div>

                  <span>→</span>

                  <div>
                    <strong>MF-218</strong>
                    <small>Successor</small>
                  </div>

                  <span>→</span>

                  <div>
                    <strong>TC-401</strong>
                    <small>Testing</small>
                  </div>
                </div>
              </div>

              <div className="prediction-explanation">
                <span>WHY SYNCRA FLAGS THIS</span>

                <p>
                  {executionEvent.activity} has only{" "}
                  <strong>1 day of float</strong>. EX-07 is unavailable
                  while wet ground conditions may reduce productivity.
                  If recovery is not achieved before the available float
                  is consumed, downstream equipment foundation work
                  becomes exposed.
                </p>
              </div>
            </div>

            <div className="prediction-footer">
              <div>
                <span>EXPOSURE</span>
                <strong>MF-218 → TC-401</strong>
              </div>

              <div>
                <span>TRIGGER</span>
                <strong>Constraint persists beyond Day 17</strong>
              </div>

              <div>
                <span>CONFIDENCE</span>
                <strong>82%</strong>
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
              <span>{executionEvent.activity}</span>
              <b>→</b>
              <span>Equipment Foundation</span>
              <b>→</b>
              <span>Testing</span>
            </div>

            <div className="float-row">
              <span>Remaining float</span>
              <strong>1 day</strong>
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

function ImpactView({ onBack, onRecovery }) {
  return (
    <section className="content">

      <div className="page-intro">
        <button className="back-button" onClick={onBack} type="button">
          ← Back to intelligence
        </button>

        <p className="section-kicker">IMPACT ANALYSIS</p>
        <h2>What does this state affect?</h2>
        <p>
          SYNCRA traces the verified execution state through the project
          network before determining project-level exposure.
        </p>
      </div>

      <div className="impact-summary">
        <div>
          <span>TRIGGER</span>
          <strong>CF-104 · Blocked</strong>
        </div>

        <div>
          <span>NETWORK EXPOSURE</span>
          <strong>2 downstream activities</strong>
        </div>

        <div>
          <span>PROJECT FINISH</span>
          <strong className="green-text">Not currently exposed</strong>
        </div>

        <div>
          <span>FLOAT</span>
          <strong className="amber-text">1 day remaining</strong>
        </div>
      </div>

      <div className="impact-card">
        <div className="panel-header">
          <div>
            <p className="section-kicker">DEPENDENCY IMPACT</p>
            <h3>Execution state through the network</h3>
          </div>

          <span className="impact-level">MODERATE</span>
        </div>

        <div className="impact-chain">
          <div className="impact-node blocked">
            <span>ACTIVITY</span>
            <strong>CF-104</strong>
            <small>Blocked · Grid A-14</small>
          </div>

          <div className="impact-connector">
            <span>FS</span>
            <i>→</i>
          </div>

          <div className="impact-node exposed">
            <span>SUCCESSOR</span>
            <strong>MF-218</strong>
            <small>Equipment Foundation</small>
          </div>

          <div className="impact-connector">
            <span>FS</span>
            <i>→</i>
          </div>

          <div className="impact-node exposed">
            <span>DOWNSTREAM</span>
            <strong>TC-401</strong>
            <small>Equipment Testing</small>
          </div>
        </div>
      </div>

      <div className="impact-analysis-grid">

        <div className="impact-detail-card">
          <p className="section-kicker">SCHEDULE EFFECT</p>
          <h3>Local disruption, not yet project delay</h3>

          <div className="effect-row">
            <span>Activity delay</span>
            <strong>Potential</strong>
          </div>

          <div className="effect-row">
            <span>Successor exposure</span>
            <strong>Yes</strong>
          </div>

          <div className="effect-row">
            <span>Critical path exposure</span>
            <strong>Not confirmed</strong>
          </div>

          <div className="effect-row">
            <span>Project finish impact</span>
            <strong className="green-text">None currently</strong>
          </div>
        </div>

        <div className="impact-detail-card">
          <p className="section-kicker">WHY IT MATTERS</p>
          <h3>Float is the protection layer</h3>

          <p className="impact-copy">
            CF-104 currently has 1 day of available float. The disruption
            can therefore be absorbed locally only while that buffer remains.
            A continued constraint could transfer the exposure to downstream
            activities.
          </p>

          <div className="impact-rule">
            <span>PROJECT IMPACT RULE</span>
            <strong>
              Activity delay ≠ Project delay
            </strong>
          </div>
        </div>

      </div>

      <div className="impact-decision">
        <div>
          <p className="section-kicker">NEXT DECISION</p>
          <h3>Recovery may be required before float is consumed.</h3>
          <p>
            SYNCRA has identified the exposure and can now generate recovery
            options for manager review.
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

function RecoveryView({ onBack, onApproved }) {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: "A",
      title: "Resequence work",
      description:
        "Move an independent downstream workfront forward while CF-104 is blocked.",
      forecast: "0 days",
      schedule: "Protects current finish",
      resource: "Low",
      risk: "Moderate",
      consequence: "Uses available workfront capacity",
      recommended: true,
    },
    {
      id: "B",
      title: "Shift resources",
      description:
        "Reassign available excavation capacity from another workfront to recover CF-104.",
      forecast: "+1 day",
      schedule: "Minor finish exposure",
      resource: "Medium",
      risk: "Low",
      consequence: "Creates pressure on donor workfront",
      recommended: false,
    },
    {
      id: "C",
      title: "Accept variance",
      description:
        "Allow the current constraint to continue without recovery intervention.",
      forecast: "+3 days",
      schedule: "Finish moves to 03 Oct",
      resource: "None",
      risk: "High",
      consequence: "Consumes remaining float and exposes testing",
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
          <strong>CF-104 · Blocked</strong>
        </div>

        <div>
          <span>AVAILABLE FLOAT</span>
          <strong className="amber-text">1 day</strong>
        </div>

        <div>
          <span>EXPOSED CHAIN</span>
          <strong>MF-218 → TC-401</strong>
        </div>

        <div>
          <span>CURRENT FORECAST</span>
          <strong>03 Oct</strong>
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
            <strong>Only 1 day</strong>
          </div>

          <div>
            <span>RESOURCE</span>
            <strong>EX-07 unavailable</strong>
          </div>

          <div>
            <span>DOWNSTREAM</span>
            <strong>Testing exposed</strong>
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

function DomainSupervisorView({ onBack, onPublish }) {
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [activePreset, setActivePreset] = useState("obstacle");
  const [reportNote, setReportNote] = useState(
    "Excavation stopped at Grid A-14 after encountering unexpected buried concrete structure. Excavator EX-07 blocked, approx 62% progress. Need rock breaker or engineering clearance."
  );
  const [quantityProgress, setQuantityProgress] = useState(62);
  const [executionStatus, setExecutionStatus] = useState("Blocked");
  const [evidenceAttached, setEvidenceAttached] = useState(true);
  const [evidenceCount, setEvidenceCount] = useState(4);
  const [activeTab, setActiveTab] = useState("extracted"); // 'extracted' | 'match' | 'context' | 'evidence'
  const [gateScenario, setGateScenario] = useState("auto-accept"); // 'auto-accept' | 'ambiguity' | 'context-mismatch' | 'contradiction' | 'unresolved'
  const [humanActionStatus, setHumanActionStatus] = useState(null); // feedback message for human actions

  // Voice memo dictation simulation
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setReportNote(
          "Voice transcript [16:42]: Excavation halted at Grid A-14. Struck massive buried concrete obstruction. EX-07 unable to dig. Progress 62%. Need breaker or reroute."
        );
        setExecutionStatus("Blocked");
        setQuantityProgress(62);
      }, 2200);
    }
  };

  // Preset scenarios
  const setScenario = (type, text, status, progress) => {
    setActivePreset(type);
    setReportNote(text);
    if (status) setExecutionStatus(status);
    if (progress !== undefined) setQuantityProgress(progress);
  };

  const currentScenario = SCENARIO_DATA[gateScenario] || SCENARIO_DATA["auto-accept"];

  // Publish event callback
  const publishCurrentEvent = useCallback((scenarioToUse) => {
    const sc = scenarioToUse || SCENARIO_DATA[gateScenario] || SCENARIO_DATA["auto-accept"];
    const event = {
      id: "EV-014",
      activity: "CF-104",
      activityName: "Foundation Excavation",
      location: "Grid A-14",
      discipline: "Civil & Groundworks",
      workfront: "Grid A-14 (Substructure Trench)",
      state: executionStatus,
      progress: `${quantityProgress}%`,
      date: "Day 14",
      time: "16:42",
      confidence: sc.confidence,
      margin: sc.margin,
      contextMatch: sc.contextMatch,
      evidence: `${evidenceCount} field photographs`,
      issue: executionStatus === "Blocked" ? "Unexpected buried concrete structure" : "Normal progress logged",
      gateRouting: sc.gateRouting,
    };
    if (onPublish) onPublish(event);
  }, [gateScenario, executionStatus, quantityProgress, evidenceCount, onPublish]);

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
    }, 180); // 180ms * 10 = ~1.8s smooth progression

    return () => clearInterval(interval);
  }, [processing, publishCurrentEvent]);

  return (
    <section className="content supervisor-flow-container">
      {/* HEADER WITH RETURN / BACK BUTTON */}
      <div className="page-intro supervisor-intro">
        <div className="intro-header-row">
          <button
            id="btn-return-nav"
            className="back-button return-btn"
            onClick={() => {
              if (submitted) {
                setSubmitted(false);
                setProcessingStep(0);
                setHumanActionStatus(null);
              } else {
                onBack();
              }
            }}
            type="button"
          >
            ← Return
          </button>

          <div className="supervisor-badge-rail">
            <span className="domain-role-tag">DOMAIN SUPERVISOR · FIELD VIEW</span>
            <span className="live-site-pulse">
              <span className="pulse-dot"></span> LIVE SITE FEED
            </span>
          </div>
        </div>

        <h2>Field Execution Capture & Trust Pipeline</h2>
        <p className="intro-subtext">
          Zero-manual-labour field intake. Supervisors submit natural language observations; SYNCRA automatically resolves project context, evaluates the 10-stage execution truth pipeline, and routes through the dual-score automation gate.
        </p>
      </div>

      {!submitted ? (
        /* ====================================================================
           1. LOW-FRICTION FIELD INPUT (Part IV, Sections 15–18)
           Project, domain, workfront and expected work supplied automatically
           ==================================================================== */
        <div className="supervisor-field-layout">
          {/* LEFT: OBSERVATION FORM & LOW-FRICTION INPUT */}
          <div className="field-entry-card">
            {/* AUTO-SUPPLIED PROJECT CONTEXT BANNER */}
            <div className="context-auto-banner">
              <div className="context-banner-header">
                <span className="context-chip">AUTO-DERIVED CONTEXT</span>
                <span className="context-rule-hint">Part IV §15: High-Context Zero-Manual-Entry</span>
              </div>
              <div className="context-grid">
                <div className="context-item">
                  <span className="ctx-label">PROJECT</span>
                  <strong className="ctx-val">Alpha Facility (Assam · Pkg 2)</strong>
                </div>
                <div className="context-item">
                  <span className="ctx-label">DOMAIN</span>
                  <strong className="ctx-val">Civil & Groundworks</strong>
                </div>
                <div className="context-item">
                  <span className="ctx-label">WORKFRONT</span>
                  <strong className="ctx-val">Grid A-14 (Substructure)</strong>
                </div>
                <div className="context-item">
                  <span className="ctx-label">DATE & SHIFT</span>
                  <strong className="ctx-val">Day 14 · Shift A (16:42 IST)</strong>
                </div>
              </div>
            </div>

            {/* PLAN-AWARE FIELD CHECKLIST (Part IV, Section 17 & Part XV §82) */}
            <div className="plan-checklist-card">
              <div className="checklist-header">
                <div>
                  <span className="checklist-kicker">PLAN-AWARE FIELD CHECKLIST (CPM SCHEDULE LINKED)</span>
                  <h4>Today&apos;s Expected Work</h4>
                </div>
                <span className="schedule-link-badge">L5/L6 Mapped in Backend</span>
              </div>
              <div className="checklist-items">
                <div className="checklist-row active-task">
                  <div className="check-box checked">✓</div>
                  <div className="check-content">
                    <strong>CF-104: Excavate foundation trench to 4.2m depth</strong>
                    <div className="check-meta">
                      <span>Target Today: 15m (65%)</span>
                      <span className="meta-sep">·</span>
                      <span>Current: 11m (62%)</span>
                      <span className="meta-sep">·</span>
                      <span className="tag-equipment">Excavator EX-07</span>
                    </div>
                  </div>
                  <span className="task-status-pill in-focus">ACTIVE FOCUS</span>
                </div>

                <div className="checklist-row next-task">
                  <div className="check-box">○</div>
                  <div className="check-content">
                    <strong>CF-105: Prepare rebar cage staging</strong>
                    <div className="check-meta">
                      <span>Target: Follow-on upon CF-104 trench clearance</span>
                      <span className="meta-sep">·</span>
                      <span>Rebar Crew #3</span>
                    </div>
                  </div>
                  <span className="task-status-pill pending">PENDING CLEARANCE</span>
                </div>
              </div>
            </div>

            {/* QUICK PRESET SCENARIO SELECTOR */}
            <div className="quick-presets-section">
              <span className="presets-title">QUICK FIELD SCENARIO PRESETS:</span>
              <div className="preset-buttons-grid">
                <button
                  type="button"
                  className={`preset-btn ${activePreset === "obstacle" ? "active" : ""}`}
                  onClick={() =>
                    setScenario(
                      "obstacle",
                      "Excavation stopped at Grid A-14 after encountering unexpected buried concrete structure. Excavator EX-07 blocked, approx 62% progress. Need rock breaker or engineering clearance.",
                      "Blocked",
                      62
                    )
                  }
                >
                  <span className="preset-icon">⚡</span>
                  <div>
                    <strong>Buried Obstacle (Obstruction)</strong>
                    <small>Grid A-14 · EX-07 halted · 62%</small>
                  </div>
                </button>

                <button
                  type="button"
                  className={`preset-btn ${activePreset === "routine" ? "active" : ""}`}
                  onClick={() =>
                    setScenario(
                      "routine",
                      "Completed 11m of foundation trench excavation at Grid A-14. Soil strata stable, trench sides shored, excavator EX-07 operating normally. Day target on schedule.",
                      "In Progress",
                      62
                    )
                  }
                >
                  <span className="preset-icon">✓</span>
                  <div>
                    <strong>Routine Progress Update</strong>
                    <small>Grid A-14 · 11m excavated · Nominal</small>
                  </div>
                </button>

                <button
                  type="button"
                  className={`preset-btn ${activePreset === "breakdown" ? "active" : ""}`}
                  onClick={() =>
                    setScenario(
                      "breakdown",
                      "Excavator EX-07 hydraulic hose ruptured at Grid A-14 workfront. Mechanical breakdown, digging halted at 62%. Maintenance crew notified.",
                      "Blocked",
                      62
                    )
                  }
                >
                  <span className="preset-icon">🚜</span>
                  <div>
                    <strong>Equipment Breakdown</strong>
                    <small>EX-07 Hydraulic failure</small>
                  </div>
                </button>

                <button
                  type="button"
                  className={`preset-btn ${activePreset === "weather" ? "active" : ""}`}
                  onClick={() =>
                    setScenario(
                      "weather",
                      "Sudden monsoon downpour flooded workfront trench at Grid A-14. Soil saturation prevents safe digging. Pumps running, progress paused at 62%.",
                      "Blocked",
                      62
                    )
                  }
                >
                  <span className="preset-icon">🌧</span>
                  <div>
                    <strong>Weather Inundation</strong>
                    <small>Heavy rainfall / flooded pit</small>
                  </div>
                </button>
              </div>
            </div>

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
                      ? `${evidenceCount} geo-tagged photos attached · Grid A-14 (26.68°N, 93.91°E) · 16:42 IST`
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
                        <h4>Normalized Field Event Schema (EV-014)</h4>
                      </div>
                      <span className="fields-count-badge">8 Parameters Extracted</span>
                    </div>

                    <div className="schema-grid">
                      <div className="schema-cell">
                        <span className="schema-k">EVENT ID</span>
                        <strong className="schema-v">EV-014</strong>
                      </div>
                      <div className="schema-cell">
                        <span className="schema-k">PROJECT</span>
                        <strong className="schema-v">Alpha Facility</strong>
                      </div>
                      <div className="schema-cell">
                        <span className="schema-k">DOMAIN</span>
                        <strong className="schema-v">Civil & Groundworks</strong>
                      </div>
                      <div className="schema-cell">
                        <span className="schema-k">WORKFRONT</span>
                        <strong className="schema-v">Grid A-14 (Substructure Sector)</strong>
                      </div>
                      <div className="schema-cell">
                        <span className="schema-k">SCHEDULE ACTIVITY</span>
                        <strong className="schema-v highlight">CF-104 · Foundation Excavation</strong>
                      </div>
                      <div className="schema-cell">
                        <span className="schema-k">EXECUTION STATUS</span>
                        <strong className={`schema-v ${executionStatus === "Blocked" ? "text-danger" : "text-success"}`}>
                          {executionStatus}
                        </strong>
                      </div>
                      <div className="schema-cell">
                        <span className="schema-k">ATOMIC PROGRESS</span>
                        <strong className="schema-v">{quantityProgress}% (11m of 17.5m completed)</strong>
                      </div>
                      <div className="schema-cell">
                        <span className="schema-k">ASSIGNED RESOURCE</span>
                        <strong className="schema-v">Excavator EX-07 (Civil Crew #1)</strong>
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
                            CF-104 is within active Early Start (ES: Day 12) / Early Finish (EF: Day 16) window. Total float: 4 days.
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
                            Predecessor CF-101 (Site Clearing) completed Day 11. Downstream successor CF-105 (Rebar Cage) awaiting trench excavation sign-off.
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
                            Cross-referenced against supervisor login context and mobile GPS telemetry (Grid A-14, Package 2).
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
                            Excavator EX-07 rostered and verified on duty at Grid A-14 during 16:42 time window.
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
                            Photographic evidence depicts exposed concrete obstruction blocking trench excavation bucket path.
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
                            <span className="photo-caption">Grid A-14 Trench Obstruction</span>
                          </div>
                          <span className="photo-tag">IMG_2026_0914_01</span>
                        </div>
                        <div className="preview-meta">
                          <strong>Buried Concrete Footing</strong>
                          <small>16:42:18 IST · EX-07 bucket contact</small>
                        </div>
                      </div>

                      <div className="evidence-card-preview">
                        <div className="preview-image-box">
                          <div className="photo-placeholder">
                            <span className="cam-glyph">📷</span>
                            <span className="photo-caption">Trench Depth Gauge (4.2m Mark)</span>
                          </div>
                          <span className="photo-tag">IMG_2026_0914_02</span>
                        </div>
                        <div className="preview-meta">
                          <strong>Excavation Depth Gauge</strong>
                          <small>Progress: 62% at refusal zone</small>
                        </div>
                      </div>

                      <div className="evidence-card-preview">
                        <div className="preview-image-box">
                          <div className="photo-placeholder">
                            <span className="cam-glyph">📷</span>
                            <span className="photo-caption">Excavator EX-07 Position</span>
                          </div>
                          <span className="photo-tag">IMG_2026_0914_03</span>
                        </div>
                        <div className="preview-meta">
                          <strong>Machine Telemetry Corroboration</strong>
                          <small>EX-07 stationed at Grid A-14 North</small>
                        </div>
                      </div>

                      <div className="evidence-card-preview">
                        <div className="preview-image-box">
                          <div className="photo-placeholder">
                            <span className="cam-glyph">📷</span>
                            <span className="photo-caption">Workfront Boundary Overview</span>
                          </div>
                          <span className="photo-tag">IMG_2026_0914_04</span>
                        </div>
                        <div className="preview-meta">
                          <strong>Grid A-14 Substructure Panorama</strong>
                          <small>Corroborates shoring & safety perimeter</small>
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
    </section>
  );
}

function UpdatedStateView() {
  return (
    <section className="content">

      <div className="page-intro">
        <p className="section-kicker">STATE UPDATED</p>

        <h2>Recovery decision incorporated</h2>

        <p>
          The manager-approved recovery action has been applied to the
          current working state. The approved baseline remains unchanged.
        </p>
      </div>

      <div className="update-success">
        <div className="success-mark">✓</div>

        <div>
          <span>manager DECISION</span>
          <strong>Plan A · Resequence work</strong>
          <p>Approved recovery strategy</p>
        </div>

        <div className="approved-badge">
          APPROVED
        </div>
      </div>

      <div className="state-update-grid">

        <div className="update-card">
          <p className="section-kicker">SCHEDULE STATE</p>

          <h3>Current working forecast</h3>

          <div className="forecast-comparison">
            <div>
              <span>PREVIOUS</span>
              <strong>03 Oct</strong>
            </div>

            <div className="forecast-arrow">→</div>

            <div>
              <span>UPDATED</span>
              <strong className="green-text">30 Sep</strong>
            </div>
          </div>

          <p>
            Resequencing absorbs the local disruption without moving the
            current project finish.
          </p>
        </div>

        <div className="update-card baseline-card">
          <p className="section-kicker">BASELINE CONTROL</p>

          <h3>Approved baseline preserved</h3>

          <div className="baseline-row">
            <span>BASELINE FINISH</span>
            <strong>30 Sep</strong>
          </div>

          <div className="baseline-row">
            <span>WORKING PLAN</span>
            <strong>Updated</strong>
          </div>

          <div className="baseline-row">
            <span>HISTORICAL ACTUAL</span>
            <strong>Preserved</strong>
          </div>
        </div>

      </div>

      <div className="state-change-card">

        <div className="panel-header">
          <div>
            <p className="section-kicker">PROJECT STATE CHANGE</p>
            <h3>What changed?</h3>
          </div>

          <span className="state-change-tag">
            RECORDED
          </span>
        </div>

        <div className="state-change-chain">

          <div className="change-node">
            <span>BEFORE</span>
            <strong>CF-104</strong>
            <small>Blocked</small>
          </div>

          <div className="change-arrow">→</div>

          <div className="change-node active">
            <span>RECOVERY</span>
            <strong>Plan A</strong>
            <small>Resequenced</small>
          </div>

          <div className="change-arrow">→</div>

          <div className="change-node">
            <span>CURRENT STATE</span>
            <strong>CF-104</strong>
            <small>Recovery in progress</small>
          </div>

        </div>
      </div>

      <div className="audit-card">

        <div>
          <p className="section-kicker">AUDIT TRAIL</p>
          <h3>Decision history preserved</h3>
        </div>

        <div className="audit-events">

          <div>
            <span>DAY 14 · 16:42</span>
            <strong>Field condition captured</strong>
            <small>Site Supervisor</small>
          </div>

          <div>
            <span>DAY 14 · 18:10</span>
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