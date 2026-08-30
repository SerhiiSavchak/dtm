import { projects as hardcodedProjects } from "@/data/projects";
import inProgressSnapshotJson from "@/data/generated/in-progress.snapshot.json" with { type: "json" };
import portfolioSnapshotJson from "@/data/generated/portfolio.snapshot.json" with { type: "json" };
import { hardcodedInProgressRecord } from "./map-in-progress";
import { hardcodedToRecord } from "./map-project";
import {
  isValidInProgressSnapshot,
  isValidPortfolioSnapshot,
} from "./snapshot";
import type { InProgressRecord, PortfolioRecord } from "./types";

const hardcodedPortfolio = hardcodedProjects.map(hardcodedToRecord);
const hardcodedInProgress = hardcodedInProgressRecord();

export function lastKnownGoodPortfolio(): PortfolioRecord[] {
  if (isValidPortfolioSnapshot(portfolioSnapshotJson)) {
    return portfolioSnapshotJson.projects;
  }
  return hardcodedPortfolio;
}

export function lastKnownGoodInProgress(): InProgressRecord {
  if (isValidInProgressSnapshot(inProgressSnapshotJson)) {
    return {
      frames: inProgressSnapshotJson.frames,
      boardIds: inProgressSnapshotJson.boardIds,
    };
  }
  return hardcodedInProgress;
}
