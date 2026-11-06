export type ShipStatus = "pending" | "pending_hq" | "approved" | "rejected";

export interface ReviewFieldDefinition {
  name: string;
  label: string;
  type: "string" | "integer" | "boolean" | "markdown" | "select";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: { value: string; label: string; description?: string; group?: string; imageUrl?: string }[];
}

export interface Ship {
  id: string;
  hoursSubmitted: number;
  submittedAt: string; // ISO 8601
  status: ShipStatus;
  approveFields?: ReviewFieldDefinition[]; // detail endpoint only
  rejectFields?: ReviewFieldDefinition[];  // detail endpoint only
  supportsRewardedOverride?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  codeUrl: string;
  demoUrl?: string;
  screenshotUrl?: string;
  authorId: string;
  hackatimeProjectKeys: string[];
  hackatimeStartDate?: string;
  platformUrl?: string;
  tags?: { label: string; color?: string }[];
  ships: Ship[];
  metadata?: Record<string, unknown>;
}

export type TimelineEvent =
  | { type: "ship"; shipId: string; actorId: string; hoursSubmitted: number; timestamp: string;
      changes?: { field: string; label: string; oldValue: string; newValue: string; diffType: "text" | "url" | "image" }[];
      displayFields?: { label: string; value: string; isInternal?: boolean }[] }
  | { type: "approval"; shipId: string; actorId: string; hoursAssigned: number; feedbackMessage: string;
      justification: string; fields?: Record<string, unknown>; rewardedHoursOverride?: number; timestamp: string }
  | { type: "rejection"; shipId: string; actorId: string; feedbackMessage: string;
      internalMessage?: string; fields?: Record<string, unknown>; timestamp: string }
  | { type: "comment"; actorId: string; message: string; isInternal: boolean; timestamp: string };