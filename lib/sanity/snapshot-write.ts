import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type {
  InProgressSnapshotFile,
  PortfolioSnapshotFile,
} from "./snapshot";
import {
  isValidInProgressSnapshot,
  isValidPortfolioSnapshot,
} from "./snapshot";

export function writeJsonAtomic(targetPath: string, value: unknown) {
  mkdirSync(path.dirname(targetPath), { recursive: true });
  const tmp = `${targetPath}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(tmp, targetPath);
}

export function readJsonFile(filePath: string): unknown {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function replacePortfolioSnapshotIfValid(
  targetPath: string,
  next: PortfolioSnapshotFile
): { ok: true } | { ok: false; reason: string } {
  if (!isValidPortfolioSnapshot(next)) {
    return { ok: false, reason: "invalid portfolio snapshot payload" };
  }
  writeJsonAtomic(targetPath, next);
  return { ok: true };
}

export function replaceInProgressSnapshotIfValid(
  targetPath: string,
  next: InProgressSnapshotFile
): { ok: true } | { ok: false; reason: string } {
  if (!isValidInProgressSnapshot(next)) {
    return { ok: false, reason: "invalid in-progress snapshot payload" };
  }
  writeJsonAtomic(targetPath, next);
  return { ok: true };
}
