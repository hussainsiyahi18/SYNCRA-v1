/**
 * SYNCRA Alpha Facility Phase 2 — Authoritative Schedule Dataset & Pure Topological CPM Engine
 *
 * All CPM schedule outputs (ES, EF, LS, LF, totalFloat, freeFloat, isCritical, criticalPath)
 * are mathematically derived by calculateCPM() from raw inputs: durations, predecessors,
 * explicit relationship lags, and milestone classifications.
 *
 * Project Day Convention: Inclusive 1-based working days.
 * - Activity EF = ES + Duration - 1 (for Duration >= 1)
 * - FS Link: ES_succ = EF_pred + 1 + Lag
 * - SS Link: ES_succ = ES_pred + Lag
 * - Project Finish Constraint: Anchored solely at terminal milestone M-03 (LF = 30)
 * - Non-terminal side milestones (e.g. M-01) inherit project finish (LF = 30, TF = +9)
 *   and do not constrain predecessors or create negative float.
 */

// 1. Authoritative Raw Inputs (No pre-calculated schedule dates or criticality flags)
export const RAW_ACTIVITIES = [
  {
    id: "CF-101",
    wbs: "1.2.1.01",
    name: "Site Clearing & Grubbing",
    discipline: "Civil & Groundworks",
    workfront: "Grid A-14",
    duration: 5,
    predecessors: [],
    type: "activity",
    status: "completed",
    percentComplete: 100
  },
  {
    id: "CF-104",
    wbs: "1.2.1.04",
    name: "Foundation Excavation",
    discipline: "Civil & Groundworks",
    workfront: "Grid A-14",
    duration: 10,
    predecessors: [{ id: "CF-101", type: "FS", lag: 0 }],
    type: "activity",
    status: "in_progress",
    percentComplete: 80
  },
  {
    id: "CF-105",
    wbs: "1.2.1.05",
    name: "Rebar Cage Pre-Assembly",
    discipline: "Civil & Groundworks",
    workfront: "Grid A-14",
    duration: 4,
    predecessors: [{ id: "CF-104", type: "SS", lag: 4 }],
    type: "activity",
    status: "completed",
    percentComplete: 100
  },
  {
    id: "CF-108",
    wbs: "1.2.1.08",
    name: "Concrete Foundation Pour & Curing",
    discipline: "Civil & Groundworks",
    workfront: "Grid A-14",
    duration: 6,
    predecessors: [
      { id: "CF-104", type: "FS", lag: 0 },
      { id: "CF-105", type: "FS", lag: 0 }
    ],
    type: "activity",
    status: "not_started",
    percentComplete: 0
  },
  {
    id: "CS-201",
    wbs: "1.2.2.01",
    name: "Structural Steel Framing",
    discipline: "Civil & Groundworks",
    workfront: "Grid A-14",
    duration: 6,
    predecessors: [{ id: "CF-108", type: "FS", lag: 0 }],
    type: "activity",
    status: "not_started",
    percentComplete: 0
  },
  {
    id: "MF-218",
    wbs: "1.3.1.02",
    name: "Equipment Foundation Pedestals",
    discipline: "Mechanical & Piping",
    workfront: "Sector B-02",
    duration: 4,
    predecessors: [{ id: "CF-108", type: "FS", lag: 0 }],
    type: "activity",
    status: "not_started",
    percentComplete: 0
  },
  {
    id: "MP-301",
    wbs: "1.3.2.01",
    name: "Header Piping Spool Fabrication",
    discipline: "Mechanical & Piping",
    workfront: "Sector B-02",
    duration: 8,
    predecessors: [{ id: "CF-101", type: "FS", lag: 6 }], // 6d offsite procurement lag
    type: "activity",
    status: "in_progress",
    percentComplete: 35
  },
  {
    id: "MP-305",
    wbs: "1.3.2.05",
    name: "Heavy Pressure Vessel Placement",
    discipline: "Mechanical & Piping",
    workfront: "Sector B-02",
    duration: 5,
    predecessors: [
      { id: "CF-108", type: "FS", lag: 0 },
      { id: "MP-301", type: "FS", lag: 2 } // 2d handling/laydown lag
    ],
    type: "activity",
    status: "not_started",
    percentComplete: 0
  },
  {
    id: "EI-310",
    wbs: "1.4.1.01",
    name: "Cable Duct Bank Trenching",
    discipline: "Electrical & Inst.",
    workfront: "Substation C-1",
    duration: 6,
    predecessors: [{ id: "CF-101", type: "FS", lag: 2 }], // 2d electrical survey lag
    type: "activity",
    status: "completed",
    percentComplete: 100
  },
  {
    id: "EI-312",
    wbs: "1.4.1.03",
    name: "MV/LV Feeder Cable Pulling",
    discipline: "Electrical & Inst.",
    workfront: "Substation C-1",
    duration: 7,
    predecessors: [{ id: "EI-310", type: "FS", lag: 0 }],
    type: "activity",
    status: "in_progress",
    percentComplete: 10
  },
  {
    id: "IN-320",
    wbs: "1.4.2.01",
    name: "Field Instrument Calibration",
    discipline: "Electrical & Inst.",
    workfront: "Substation C-1",
    duration: 5,
    predecessors: [{ id: "EI-312", type: "FS", lag: 0 }],
    type: "activity",
    status: "not_started",
    percentComplete: 0
  },
  {
    id: "TC-401",
    wbs: "1.5.1.01",
    name: "Cold Loop & Hydro-Testing",
    discipline: "Testing & Commissioning",
    workfront: "Facility-wide",
    duration: 2,
    predecessors: [
      { id: "CS-201", type: "FS", lag: 0 },
      { id: "MF-218", type: "FS", lag: 0 },
      { id: "MP-305", type: "FS", lag: 0 },
      { id: "IN-320", type: "FS", lag: 0 }
    ],
    type: "activity",
    status: "not_started",
    percentComplete: 0
  },
  {
    id: "M-01",
    wbs: "1.2.1.99",
    name: "Civil Foundation Handover Milestone",
    discipline: "Civil & Groundworks",
    workfront: "Grid A-14",
    duration: 0,
    predecessors: [{ id: "CF-108", type: "FS", lag: 0 }],
    type: "milestone",
    milestoneType: "finish",
    isTerminal: false,
    status: "not_started",
    percentComplete: 0
  },
  {
    id: "M-03",
    wbs: "1.5.1.99",
    name: "Substantial Completion & Turnover",
    discipline: "Testing & Commissioning",
    workfront: "Facility-wide",
    duration: 0,
    predecessors: [{ id: "TC-401", type: "FS", lag: 0 }],
    type: "milestone",
    milestoneType: "turnover",
    isTerminal: true,
    status: "not_started",
    percentComplete: 0
  }
];

/**
 * Validates 100% bidirectional reciprocity between predecessors and successors.
 */
export function validateScheduleTopology(nodes) {
  const errors = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Check that all predecessor targets exist
  for (const node of nodes) {
    for (const pred of node.predecessors) {
      if (!nodeMap.has(pred.id)) {
        errors.push(`Node ${node.id} references non-existent predecessor ${pred.id}`);
      }
    }
  }

  // Check reciprocal symmetry
  for (const node of nodes) {
    for (const pred of node.predecessors) {
      const predNode = nodeMap.get(pred.id);
      if (!predNode) continue;
      const reciprocal = (predNode.successors || []).find(s => s.id === node.id);
      if (!reciprocal) {
        errors.push(`Missing reciprocal successor: ${pred.id} -> ${node.id}`);
      } else if (reciprocal.type !== pred.type || reciprocal.lag !== pred.lag) {
        errors.push(`Mismatched relationship parameters between ${pred.id} and ${node.id}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errorCount: errors.length,
    errors
  };
}

/**
 * Pure CPM calculation engine.
 * Computes ES, EF, LS, LF, totalFloat, freeFloat, and isCritical dynamically.
 */
export function calculateCPM(rawList) {
  // Deep clone raw activities to keep input pure
  const nodes = rawList.map(item => ({
    ...item,
    predecessors: item.predecessors.map(p => ({ ...p })),
    successors: []
  }));

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // 1. Populate reciprocal successors bidirectionally
  for (const node of nodes) {
    for (const pred of node.predecessors) {
      const predNode = nodeMap.get(pred.id);
      if (predNode) {
        predNode.successors.push({
          id: node.id,
          type: pred.type,
          lag: pred.lag || 0
        });
      }
    }
  }

  // 2. Topological Sort (Kahn's Algorithm)
  const inDegree = new Map();
  nodes.forEach(n => inDegree.set(n.id, n.predecessors.length));

  const queue = nodes.filter(n => inDegree.get(n.id) === 0);
  const topoOrder = [];

  while (queue.length > 0) {
    const current = queue.shift();
    topoOrder.push(current);

    for (const succ of current.successors) {
      const currentInDegree = inDegree.get(succ.id) - 1;
      inDegree.set(succ.id, currentInDegree);
      if (currentInDegree === 0) {
        queue.push(nodeMap.get(succ.id));
      }
    }
  }

  if (topoOrder.length !== nodes.length) {
    throw new Error("CPM Network contains circular dependencies!");
  }

  // 3. Inclusive Forward Pass
  for (const node of topoOrder) {
    if (node.predecessors.length === 0) {
      node.earlyStart = 1;
    } else {
      let maxES = 1;
      for (const predRef of node.predecessors) {
        const predNode = nodeMap.get(predRef.id);
        const lag = predRef.lag || 0;
        let candES = 1;

        if (predRef.type === "FS") {
          if (node.type === "milestone" && node.milestoneType === "finish") {
            // Finish handover milestone marks completion boundary of predecessor (Day 21)
            candES = predNode.earlyFinish + lag;
          } else {
            // Standard inclusive FS: starts day after finish + lag
            candES = predNode.earlyFinish + 1 + lag;
          }
        } else if (predRef.type === "SS") {
          candES = predNode.earlyStart + lag;
        }

        if (candES > maxES) {
          maxES = candES;
        }
      }
      node.earlyStart = maxES;
    }

    if (node.duration > 0) {
      node.earlyFinish = node.earlyStart + node.duration - 1;
    } else {
      node.earlyFinish = node.earlyStart;
    }
  }

  // 4. Backward Pass
  // Identify sole project terminal constraint (M-03)
  const terminalNodes = nodes.filter(n => n.isTerminal === true);
  const maxProjectEF = Math.max(...nodes.map(n => n.earlyFinish));
  const projectFinish = terminalNodes.length > 0 ? terminalNodes[0].earlyFinish : maxProjectEF;

  // Initialize leaf / terminal nodes
  for (const node of nodes) {
    if (node.isTerminal === true) {
      node.lateFinish = projectFinish;
      node.lateStart = projectFinish;
    } else if (node.successors.length === 0) {
      // Non-terminal side milestone (e.g. M-01) defaults to project finish boundary
      node.lateFinish = projectFinish;
      node.lateStart = projectFinish;
    } else {
      node.lateFinish = Infinity;
      node.lateStart = Infinity;
    }
  }

  // Reverse topological order backward pass
  const reverseTopo = [...topoOrder].reverse();

  for (const node of reverseTopo) {
    if (node.successors.length > 0) {
      let minLateBoundary = Infinity;

      for (const succRef of node.successors) {
        const succNode = nodeMap.get(succRef.id);
        const lag = succRef.lag || 0;
        let lateBound = Infinity;

        if (succRef.type === "FS") {
          if (succNode.type === "milestone" && succNode.milestoneType === "finish") {
            // Predecessor finishes at milestone boundary
            lateBound = succNode.lateStart - lag;
          } else {
            // Predecessor finishes day before successor starts - lag
            lateBound = succNode.lateStart - 1 - lag;
          }
        } else if (succRef.type === "SS") {
          lateBound = succNode.lateStart - lag + node.duration - 1;
        }

        if (lateBound < minLateBoundary) {
          minLateBoundary = lateBound;
        }
      }

      node.lateFinish = minLateBoundary;
      if (node.duration > 0) {
        node.lateStart = node.lateFinish - node.duration + 1;
      } else {
        node.lateStart = node.lateFinish;
      }
    }
  }

  // 5. Compute Float Metrics & Criticality
  for (const node of nodes) {
    node.totalFloat = node.lateStart - node.earlyStart;

    // Free Float calculation
    if (node.successors.length === 0) {
      node.freeFloat = projectFinish - node.earlyFinish;
    } else {
      let minFF = Infinity;
      for (const succRef of node.successors) {
        const succNode = nodeMap.get(succRef.id);
        const lag = succRef.lag || 0;
        let linkFF = Infinity;

        if (succRef.type === "FS") {
          if (succNode.type === "milestone" && succNode.milestoneType === "finish") {
            linkFF = succNode.earlyStart - lag - node.earlyFinish;
          } else {
            linkFF = succNode.earlyStart - 1 - lag - node.earlyFinish;
          }
        } else if (succRef.type === "SS") {
          linkFF = succNode.earlyStart - lag - node.earlyStart;
        }

        if (linkFF < minFF) {
          minFF = linkFF;
        }
      }
      node.freeFloat = Math.max(0, minFF);
    }

    // Criticality: strictly zero total float and identical early/late start
    node.isCritical = (node.totalFloat === 0 && node.earlyStart === node.lateStart);
  }

  return nodes;
}

// 6. Pre-computed Active Working Model
export const SCHEDULE_ACTIVITIES = calculateCPM(RAW_ACTIVITIES);

// 7. Topology Integrity Check
export const TOPOLOGY_VALIDATION = validateScheduleTopology(SCHEDULE_ACTIVITIES);

/**
 * Returns full project baseline critical path chain from start to terminal milestone.
 */
export function getCriticalPath(activities = SCHEDULE_ACTIVITIES) {
  return activities
    .filter(a => a.isCritical)
    .sort((a, b) => a.earlyStart - b.earlyStart)
    .map(a => a.id);
}

/**
 * Returns active uncompleted critical path at a given status day.
 * Default status date is Day 14.
 */
export function getActiveCriticalPath(statusDay = 14, activities = SCHEDULE_ACTIVITIES) {
  return activities
    .filter(a => a.isCritical && (a.status !== "completed" || a.earlyFinish >= statusDay))
    .sort((a, b) => a.earlyStart - b.earlyStart)
    .map(a => a.id);
}

/**
 * Returns activity by ID.
 */
export function getActivityById(id, activities = SCHEDULE_ACTIVITIES) {
  return activities.find(a => a.id === id) || null;
}

/**
 * Returns high-level Alpha Facility project summary metrics.
 */
export function getProjectSummary(activities = SCHEDULE_ACTIVITIES) {
  const criticalActivities = activities.filter(a => a.type === "activity" && a.isCritical);
  const activeCritical = activities.filter(
    a => a.type === "activity" && a.isCritical && (a.status !== "completed" || a.earlyFinish >= 14)
  );

  return {
    projectName: "Alpha Facility",
    phase: "Phase 2",
    location: "Assam",
    statusDate: 14,
    totalNodes: activities.length,
    criticalActivitiesCount: criticalActivities.length,
    activeCriticalCount: activeCritical.length,
    baselineCriticalPath: getCriticalPath(activities),
    activeCriticalPath: getActiveCriticalPath(14, activities),
    physicalProgress: "68.4%",
    currentForecast: "+3 days",
    status: "Active"
  };
}
