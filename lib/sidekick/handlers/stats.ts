import { repo } from "../repo";

export async function getProgramStats() {
  return {
    pendingReviewCount: await repo.countProjectsWithPendingShip(),
    pendingHqCount: await repo.countShipsByStatus("pending_hq"),
    pendingFulfillmentCount: 0,
  };
}