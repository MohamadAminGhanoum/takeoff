import { pgTable, text, real, timestamp, jsonb } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  codeUrl: text("code_url").notNull(),
  demoUrl: text("demo_url"),
  screenshotUrl: text("screenshot_url"),
  authorId: text("author_id").notNull(),
  hackatimeProjectKeys: text("hackatime_project_keys").array().notNull().$defaultFn(() => []),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ships = pgTable("ships", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  hoursSubmitted: real("hours_submitted").notNull(),
  status: text("status", { enum: ["pending", "pending_hq", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  hoursAssigned: real("hours_assigned"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const timelineEvents = pgTable("timeline_events", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  shipId: text("ship_id").references(() => ships.id),
  type: text("type", { enum: ["ship", "approval", "rejection", "comment"] }).notNull(),
  actorId: text("actor_id").notNull(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
}); 