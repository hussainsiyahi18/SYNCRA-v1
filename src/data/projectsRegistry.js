/**
 * SYNCRA — Enterprise Projects Registry & Multi-Project Context Model
 *
 * Provides facility-agnostic project registry, isolating project-specific WBS datasets,
 * status dates, and CPM configurations from the generic SYNCRA application shell.
 */

import { SCHEDULE_ACTIVITIES } from "./alphaFacilityData.js";
import { DEMO_SCENARIOS } from "./demoScenarios.js";

export const PROJECT_ALPHA = {
  id: "alpha-facility-assam",
  aliases: ["alpha-facility-assam", "alpha-facility", "assam", "alpha", "PRJ-EPC-02"],
  name: "Alpha Facility Phase 2",
  code: "PRJ-EPC-02",
  location: "Assam, India",
  client: "Brahmaputra Petrochemicals Corp",
  sector: "Petrochemical & Process Refining Complex",
  statusDate: "Day 14 · Shift A",
  statusDay: 14,
  baselineFinishDay: 30,
  forecastFinishDay: 33,
  status: "Active Execution",
  health: "Warning · Critical Exposure",
  healthTone: "warning",
  supervisor: {
    name: "Arjun Sharma",
    role: "Lead Field Supervisor (Civil)",
    assignedWorkfront: "Grid A-14 · Substructure"
  },
  capabilities: {
    hasSimulationSandbox: true,
    hasFullCpmEngine: true,
    hasFieldReporting: true
  },
  summaryStats: {
    physicalProgress: 68.4,
    progressTrend: "↑ 3.2% this week",
    forecastVariance: "+3 days",
    activeCriticalCount: 2,
    criticalChainPreview: "CF-104 → CF-108 → CS-201 → TC-401 → M-03",
    openDecisions: 1
  },
  attentionItems: [
    {
      id: "att-1",
      severity: "high",
      title: "CF-104 · Unexpected site condition",
      description: "Foundation excavation blocked at Grid A-14.",
      meta: "Testing milestone M-03 exposed (+3d variance)"
    },
    {
      id: "att-2",
      severity: "medium",
      title: "EX-07 · Equipment constraint",
      description: "Excavator idle awaiting rock breaker clearance.",
      meta: "Resource conflict detected"
    },
    {
      id: "att-3",
      severity: "medium",
      title: "IN-320 · Instrumentation calibration gap",
      description: "Calibration window scheduled upon structural completion.",
      meta: "Integrated testing dependency flagged"
    }
  ],
  activities: SCHEDULE_ACTIVITIES,
  demoScenarios: DEMO_SCENARIOS,
  defaultScenarioId: "cf104-blockage"
};

export const PROJECT_RAJASTHAN = {
  id: "thar-solar-rajasthan",
  aliases: ["thar-solar-rajasthan", "thar-solar", "rajasthan", "solar", "PRJ-REN-04"],
  name: "Thar Solar Complex Package 4",
  code: "PRJ-REN-04",
  location: "Bikaner, Rajasthan, India",
  client: "Rajasthan Renewable Energy Corp",
  sector: "450 MW Ultra-Mega Solar PV & 220kV Grid Substation",
  statusDate: "Day 42 · Shift A",
  statusDay: 42,
  baselineFinishDay: 90,
  forecastFinishDay: 90,
  status: "Active Execution",
  health: "Normal · On Schedule",
  healthTone: "normal",
  supervisor: {
    name: "Vikram Rathore",
    role: "Solar Field Supervisor (Electrical)",
    assignedWorkfront: "Block C-08 · Inverter Yard"
  },
  capabilities: {
    hasSimulationSandbox: false,
    hasFullCpmEngine: false,
    hasFieldReporting: true
  },
  summaryStats: {
    physicalProgress: 46.2,
    progressTrend: "↑ 4.8% this week",
    forecastVariance: "0 days",
    activeCriticalCount: 6,
    criticalChainPreview: "SP-101 → SP-201 → SP-204 → SP-208 → EE-302 → M-02 → TC-501 → M-04",
    openDecisions: 0
  },
  attentionItems: [
    {
      id: "att-r1",
      severity: "low",
      title: "SP-204 · PV Module Stringing (Active)",
      description: "Block C-08 stringing executing at 1.4 MWp/day pace.",
      meta: "Progress on track against Day 90 COD"
    },
    {
      id: "att-r2",
      severity: "low",
      title: "EE-302 · Transmission Line Corridor",
      description: "33kV transmission corridor row clearance completed.",
      meta: "Corridor clear for tower stringing"
    },
    {
      id: "att-r3",
      severity: "low",
      title: "Environmental · High GHI Operational Envelope",
      description: "Optimal solar radiation recorded (5.9 kWh/m²/day).",
      meta: "Climatic operational envelope normal"
    }
  ],
  // Independent lightweight solar EPC network
  activities: [
    {
      id: "SP-101",
      wbs: "2.1.01",
      name: "Array Site Grading & Ramming",
      discipline: "Civil & Groundworks",
      duration: 15,
      earlyStart: 1,
      earlyFinish: 15,
      lateStart: 7,
      lateFinish: 21,
      totalFloat: 6,
      isCritical: false,
      status: "Complete",
      predecessors: [],
      successors: [{ id: "SP-201", type: "FS", lag: 0 }]
    },
    {
      id: "SP-201",
      wbs: "2.2.01",
      name: "Tracker Structure Assembly",
      discipline: "Mechanical",
      duration: 20,
      earlyStart: 16,
      earlyFinish: 35,
      lateStart: 20,
      lateFinish: 39,
      totalFloat: 4,
      isCritical: false,
      status: "Complete",
      predecessors: [{ id: "SP-101", type: "FS", lag: 0 }],
      successors: [{ id: "SP-204", type: "FS", lag: 0 }]
    },
    {
      id: "SP-204",
      wbs: "2.2.04",
      name: "PV Module Stringing & Cabling",
      discipline: "Solar EPC",
      duration: 14,
      earlyStart: 36,
      earlyFinish: 49,
      lateStart: 36,
      lateFinish: 49,
      totalFloat: 0,
      isCritical: true,
      status: "In Progress",
      predecessors: [{ id: "SP-201", type: "FS", lag: 0 }],
      successors: [{ id: "SP-208", type: "FS", lag: 0 }]
    },
    {
      id: "SP-208",
      wbs: "2.3.01",
      name: "Inverter Station & Transformer Hookup",
      discipline: "Electrical",
      duration: 12,
      earlyStart: 50,
      earlyFinish: 61,
      lateStart: 50,
      lateFinish: 61,
      totalFloat: 0,
      isCritical: true,
      status: "Scheduled",
      predecessors: [{ id: "SP-204", type: "FS", lag: 0 }],
      successors: [{ id: "EE-302", type: "FS", lag: 0 }]
    },
    {
      id: "EE-302",
      wbs: "2.4.01",
      name: "33kV Power Evacuation Line",
      discipline: "Grid Transmission",
      duration: 18,
      earlyStart: 62,
      earlyFinish: 79,
      lateStart: 62,
      lateFinish: 79,
      totalFloat: 0,
      isCritical: true,
      status: "Scheduled",
      predecessors: [{ id: "SP-208", type: "FS", lag: 0 }],
      successors: [{ id: "M-02", type: "FS", lag: 0 }]
    },
    {
      id: "M-02",
      wbs: "2.4.05",
      name: "Substation Pre-Commissioning Clearance",
      discipline: "Milestone",
      duration: 0,
      earlyStart: 80,
      earlyFinish: 80,
      lateStart: 80,
      lateFinish: 80,
      totalFloat: 0,
      isCritical: true,
      status: "Milestone",
      predecessors: [{ id: "EE-302", type: "FS", lag: 0 }],
      successors: [{ id: "TC-501", type: "FS", lag: 0 }]
    },
    {
      id: "TC-501",
      wbs: "2.5.01",
      name: "Grid Synchronization & Performance Testing",
      discipline: "Commissioning",
      duration: 10,
      earlyStart: 81,
      earlyFinish: 90,
      lateStart: 81,
      lateFinish: 90,
      totalFloat: 0,
      isCritical: true,
      status: "Scheduled",
      predecessors: [{ id: "M-02", type: "FS", lag: 0 }],
      successors: [{ id: "M-04", type: "FS", lag: 0 }]
    },
    {
      id: "M-04",
      wbs: "2.5.05",
      name: "Commercial Operation Date (COD)",
      discipline: "Milestone",
      duration: 0,
      earlyStart: 90,
      earlyFinish: 90,
      lateStart: 90,
      lateFinish: 90,
      totalFloat: 0,
      isCritical: true,
      status: "Milestone",
      predecessors: [{ id: "TC-501", type: "FS", lag: 0 }],
      successors: []
    }
  ],
  demoScenarios: [],
  defaultScenarioId: null
};

export const PROJECTS_REGISTRY = {
  "alpha-facility-assam": PROJECT_ALPHA,
  "alpha-facility": PROJECT_ALPHA,
  "assam": PROJECT_ALPHA,
  "thar-solar-rajasthan": PROJECT_RAJASTHAN,
  "thar-solar": PROJECT_RAJASTHAN,
  "rajasthan": PROJECT_RAJASTHAN
};

/**
 * Returns an array of distinct registered project descriptors.
 */
export function getAllProjects() {
  return [PROJECT_ALPHA, PROJECT_RAJASTHAN];
}

/**
 * Returns a specific project context by its ID or alias.
 */
export function getProjectById(projectId) {
  if (!projectId) return null;
  const key = String(projectId).trim().toLowerCase();
  if (PROJECTS_REGISTRY[key]) return PROJECTS_REGISTRY[key];

  for (const proj of [PROJECT_ALPHA, PROJECT_RAJASTHAN]) {
    if (proj.id.toLowerCase() === key) return proj;
    if (proj.aliases && proj.aliases.some((a) => a.toLowerCase() === key)) return proj;
    if (proj.name.toLowerCase().includes(key) || key.includes(proj.name.toLowerCase())) return proj;
    if (proj.id.toLowerCase().includes(key) || key.includes(proj.id.toLowerCase())) return proj;
  }
  return null;
}

/**
 * Returns a unified schedule state object for the given project and scenario.
 * Encapsulates simulation dispatch so App.jsx remains facility-agnostic.
 */
export function getProjectScheduleState(project, scenarioId, simulateSchedulePerturbation, getScenarioById) {
  if (!project) return null;

  // Resolve active scenario: use passed scenarioId or default for simulation projects
  const activeScId = scenarioId !== undefined && scenarioId !== null ? scenarioId : project.defaultScenarioId;

  if (project.capabilities.hasSimulationSandbox && activeScId && simulateSchedulePerturbation && getScenarioById) {
    const sc = getScenarioById(activeScId);
    if (sc) {
      return simulateSchedulePerturbation(project.activities, {
        activityId: sc.activityId,
        delayDays: sc.delayDays,
        newStatus: sc.newStatus,
        reason: sc.reason
      });
    }
  }

  // Baseline on-schedule state for projects without active perturbation
  const terminalAct = project.activities.find((a) => a.id === "M-04" || a.id === "M-03") || project.activities[project.activities.length - 1];
  const finishDay = terminalAct ? terminalAct.earlyFinish : project.baselineFinishDay;
  const targetAct = project.activities.find((a) => a.status === "In Progress") || project.activities[0];

  return {
    disturbance: {
      activityId: null,
      delayDays: 0,
      newStatus: "Normal Execution",
      reason: "No active hindrance reported. Operations executing per plan."
    },
    targetNode: {
      id: targetAct.id,
      name: targetAct.name,
      status: targetAct.status,
      totalFloat: targetAct.totalFloat || 0
    },
    isProjectFinishDelayed: false,
    projectDelayDays: 0,
    milestoneExposure: {
      [terminalAct.id]: {
        name: terminalAct.name,
        baselineEF: finishDay,
        perturbedEF: finishDay,
        variance: 0,
        totalFloat: terminalAct.totalFloat || 0
      }
    },
    exposedCriticalChain: project.activities.map((a) => ({
      id: a.id,
      name: a.name,
      earlyFinish: a.earlyFinish,
      isCritical: a.isCritical,
      totalFloat: a.totalFloat
    })),
    erodedActivities: [],
    perturbedActivities: project.activities,
    baselineActivities: project.activities
  };
}

/**
 * Default initial project ID for clean demo bootstrap.
 */
export const DEFAULT_PROJECT_ID = "alpha-facility-assam";
