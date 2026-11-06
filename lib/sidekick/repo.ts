import type { Project, ShipStatus, TimelineEvent } from "./types";

export interface Repo {
  countProjectsWithPendingShip(): Promise<number>;
  countShipsByStatus(s: ShipStatus): Promise<number>;
  listProjects(opts: { status?: ShipStatus | "all"; cursor?: string; limit: number }):
    Promise<{ projects: Project[]; nextCursor?: string; totalCount: number }>;
  getProject(id: string): Promise<Project | null>;
  getTimeline(projectId: string): Promise<TimelineEvent[]>;
}

export const repo: Repo = null as unknown as Repo;