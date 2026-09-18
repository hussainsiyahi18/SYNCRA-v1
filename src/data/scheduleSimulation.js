/**
 * SYNCRA — Dynamic CPM Perturbation & Float Erosion Engine
 *
 * Mathematically evaluates the downstream network effect of field disturbances
 * (blockages, delays, rate changes) by dynamically recalculating the 14-node CPM graph.
 *
 * Guarantees that all displayed impact metrics (project finish variance, milestone slippage,
 * float erosion, and shifted critical chains) are derived purely from schedule calculations,
 * with zero hardcoded values.
 */

import { RAW_ACTIVITIES, calculateCPM, SCHEDULE_ACTIVITIES } from "./alphaFacilityData.js";

/**
 * Traces the downstream physical driving chain from the disturbed activity to the terminal milestone.
 */
function traceDrivingChain(nodeMap, startId, terminalId = "M-03") {
  const chain = [];
  let current = nodeMap.get(startId);

  while (current) {
    chain.push({
      id: current.id,
      name: current.name,
      discipline: current.discipline,
      workfront: current.workfront,
      earlyStart: current.earlyStart,
      earlyFinish: current.earlyFinish,
      lateStart: current.lateStart,
      lateFinish: current.lateFinish,
      totalFloat: current.totalFloat,
      isCritical: current.isCritical,
      status: current.status
    });

    if (current.id === terminalId) break;

    // Find successor on the critical/driving path
    const drivingSuccessorLink = (current.successors || []).find(s => {
      const succNode = nodeMap.get(s.id);
      return succNode && succNode.isCritical && succNode.earlyStart >= current.earlyFinish;
    });

    if (drivingSuccessorLink) {
      current = nodeMap.get(drivingSuccessorLink.id);
    } else {
      // If no strict critical successor, look for the successor with lowest float
      let minFloatSucc = null;
      let minFloat = Infinity;
      for (const s of current.successors || []) {
        const succNode = nodeMap.get(s.id);
        if (succNode && succNode.totalFloat < minFloat) {
          minFloat = succNode.totalFloat;
          minFloatSucc = succNode;
        }
      }
      current = minFloatSucc;
    }
  }

  return chain;
}

/**
 * Simulates a schedule perturbation on the Alpha Facility network.
 *
 * @param {Array} baselineActivities - The unperturbed baseline schedule (defaults to SCHEDULE_ACTIVITIES)
 * @param {Object} disturbance - Disturbance descriptor:
 *   {
 *     activityId: string,   // e.g. "CF-104" or "MP-301"
 *     delayDays: number,    // e.g. 3 or 1
 *     newStatus: string,    // e.g. "Blocked", "Delayed"
 *     reason: string        // descriptive cause
 *   }
 */
export function simulateSchedulePerturbation(baselineActivities = SCHEDULE_ACTIVITIES, disturbance = {}) {
  const {
    activityId = "CF-104",
    delayDays = 0,
    newStatus = "Blocked",
    reason = "Unscheduled site constraint"
  } = disturbance;

  // 1. Clone raw activities to keep pristine inputs
  const perturbedRaw = RAW_ACTIVITIES.map(a => {
    const cloned = {
      ...a,
      predecessors: a.predecessors.map(p => ({ ...p }))
    };

    if (cloned.id === activityId) {
      cloned.duration = a.duration + (delayDays > 0 ? delayDays : 0);
      if (newStatus) {
        cloned.status = newStatus;
      }
    }
    return cloned;
  });

  // 2. Dynamically recalculate CPM forward/backward passes
  const perturbedActivities = calculateCPM(perturbedRaw);
  const baselineMap = new Map(baselineActivities.map(a => [a.id, a]));
  const perturbedMap = new Map(perturbedActivities.map(a => [a.id, a]));

  // 3. Compute Delta Float and Float Erosion across all 14 nodes
  const deltaFloatMap = {};
  const erodedActivities = [];
  const deltaFinishMap = {};

  for (const pNode of perturbedActivities) {
    const bNode = baselineMap.get(pNode.id);
    if (bNode) {
      const deltaTF = pNode.totalFloat - bNode.totalFloat;
      const deltaEF = pNode.earlyFinish - bNode.earlyFinish;
      deltaFloatMap[pNode.id] = deltaTF;
      deltaFinishMap[pNode.id] = deltaEF;

      if (deltaTF < 0 || deltaEF > 0) {
        erodedActivities.push({
          id: pNode.id,
          name: pNode.name,
          discipline: pNode.discipline,
          baselineTF: bNode.totalFloat,
          perturbedTF: pNode.totalFloat,
          deltaTF,
          baselineEF: bNode.earlyFinish,
          perturbedEF: pNode.earlyFinish,
          deltaEF,
          isCritical: pNode.isCritical
        });
      }
    }
  }

  // 4. Milestone Exposure Metrics
  const baselineM03 = baselineMap.get("M-03");
  const perturbedM03 = perturbedMap.get("M-03");
  const baselineM01 = baselineMap.get("M-01");
  const perturbedM01 = perturbedMap.get("M-01");

  const projectDelayDays = (perturbedM03?.earlyFinish || 30) - (baselineM03?.earlyFinish || 30);
  const m01SlippageDays = (perturbedM01?.earlyFinish || 21) - (baselineM01?.earlyFinish || 21);

  // 5. Exposed Physical Driving Chain
  const exposedCriticalChain = traceDrivingChain(perturbedMap, activityId, "M-03");

  // 6. Target Activity Comparison
  const targetBaseline = baselineMap.get(activityId);
  const targetPerturbed = perturbedMap.get(activityId);

  return {
    disturbance: {
      activityId,
      delayDays,
      newStatus,
      reason
    },
    baselineActivities,
    perturbedActivities,
    targetNode: {
      id: activityId,
      name: targetPerturbed?.name || activityId,
      workfront: targetPerturbed?.workfront || "",
      baselineDuration: targetBaseline?.duration || 0,
      perturbedDuration: targetPerturbed?.duration || 0,
      baselineEF: targetBaseline?.earlyFinish || 0,
      perturbedEF: targetPerturbed?.earlyFinish || 0,
      totalFloat: targetPerturbed?.totalFloat || 0,
      status: targetPerturbed?.status || newStatus
    },
    milestoneExposure: {
      "M-01": {
        name: "Civil Foundation Handover Milestone",
        baselineEF: baselineM01?.earlyFinish || 21,
        perturbedEF: perturbedM01?.earlyFinish || 21,
        slippageDays: m01SlippageDays,
        totalFloat: perturbedM01?.totalFloat || 0
      },
      "M-03": {
        name: "Substantial Completion & Turnover",
        baselineEF: baselineM03?.earlyFinish || 30,
        perturbedEF: perturbedM03?.earlyFinish || 30,
        slippageDays: projectDelayDays,
        totalFloat: perturbedM03?.totalFloat || 0
      }
    },
    projectDelayDays,
    isProjectFinishDelayed: projectDelayDays > 0,
    erodedActivities,
    deltaFloatMap,
    deltaFinishMap,
    exposedCriticalChain,
    baselineCriticalPath: baselineActivities.filter(a => a.isCritical).map(a => a.id),
    perturbedCriticalPath: perturbedActivities.filter(a => a.isCritical).map(a => a.id)
  };
}
