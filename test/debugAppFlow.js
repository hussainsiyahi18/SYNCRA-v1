import {
  getProjectById,
  getProjectScheduleState,
  DEFAULT_PROJECT_ID
} from "../src/data/projectsRegistry.js";
import { simulateSchedulePerturbation } from "../src/data/scheduleSimulation.js";
import { getScenarioById } from "../src/data/demoScenarios.js";

console.log("=== DEBUGGING APP FLOW ===");

// 1. Initial State:
let selectedProjectId = null;
let activeScenarioId = "cf104-blockage";

let currentProject = getProjectById(selectedProjectId) || getProjectById(DEFAULT_PROJECT_ID);
console.log("Initial currentProject:", currentProject?.id);

let currentPerturbation = getProjectScheduleState(
  currentProject,
  activeScenarioId,
  simulateSchedulePerturbation,
  getScenarioById
);
console.log("Initial currentPerturbation targetNode:", currentPerturbation?.targetNode?.id, "finish:", currentPerturbation?.milestoneExposure);

// 2. Select Alpha Facility:
console.log("\n--- Selecting Alpha Facility ---");
selectedProjectId = "alpha-facility-assam";
currentProject = getProjectById(selectedProjectId);
console.log("currentProject after selecting alpha-facility-assam:", currentProject?.id);

currentPerturbation = getProjectScheduleState(
  currentProject,
  activeScenarioId,
  simulateSchedulePerturbation,
  getScenarioById
);
console.log("Alpha currentPerturbation targetNode:", currentPerturbation?.targetNode?.id, "delayDays:", currentPerturbation?.projectDelayDays);

// 3. Select Rajasthan:
console.log("\n--- Selecting Rajasthan ---");
selectedProjectId = "thar-solar-rajasthan";
currentProject = getProjectById(selectedProjectId);
console.log("currentProject after selecting thar-solar-rajasthan:", currentProject?.id);

activeScenarioId = null; // switching to rajasthan clears scenario
currentPerturbation = getProjectScheduleState(
  currentProject,
  activeScenarioId,
  simulateSchedulePerturbation,
  getScenarioById
);
console.log("Rajasthan currentPerturbation targetNode:", currentPerturbation?.targetNode?.id, "delayDays:", currentPerturbation?.projectDelayDays);
console.log("Rajasthan exposedCriticalChain:", currentPerturbation?.exposedCriticalChain);
console.log("Rajasthan milestoneExposure:", currentPerturbation?.milestoneExposure);

// 4. Switch back to Alpha Facility:
console.log("\n--- Switching back to Alpha Facility ---");
selectedProjectId = "alpha-facility-assam";
currentProject = getProjectById(selectedProjectId);
activeScenarioId = currentProject.defaultScenarioId; // cf104-blockage
currentPerturbation = getProjectScheduleState(
  currentProject,
  activeScenarioId,
  simulateSchedulePerturbation,
  getScenarioById
);
console.log("Alpha returned targetNode:", currentPerturbation?.targetNode?.id, "delayDays:", currentPerturbation?.projectDelayDays);
console.log("Alpha milestoneExposure:", currentPerturbation?.milestoneExposure);

console.log("\n=== ALL LOGIC EXECUTED CLEANLY ===");
