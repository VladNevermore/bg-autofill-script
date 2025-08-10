import { logger } from "./logger.js";

export function compareData(saved, current) {
  const diffs = [];
  for (const key in saved) {
    if (saved[key] != current[key]) {
      diffs.push({
        field: key,
        saved: saved[key],
        current: current[key],
      });
    }
  }
  logger.info("Differences found:", diffs);
  return diffs;
}
