import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  householdName: text("household_name").notNull().default("Home"),
  astrologyDetails: text("astrology_details"),
  humanDesignDetails: text("human_design_details"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const householdMembers = sqliteTable("household_members", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  relationship: text("relationship"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  notes: text("notes"),
  status: text("status", {
    enum: ["active", "completed", "archived"],
  })
    .notNull()
    .default("active"),
  dueDate: text("due_date"),
  priority: text("priority", {
    enum: ["low", "medium", "high"],
  }),
  category: text("category"),
  projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
  assigneeMemberId: text("assignee_member_id").references(
    () => householdMembers.id,
    { onDelete: "set null" }
  ),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const recurrenceRules = sqliteTable(
  "recurrence_rules",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    frequency: text("frequency", {
      enum: ["daily", "weekly", "monthly"],
    }).notNull(),
    interval: integer("interval").notNull().default(1),
    daysOfWeek: text("days_of_week"),
    dayOfMonth: integer("day_of_month"),
    endsOn: text("ends_on"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    taskIdUnique: uniqueIndex("recurrence_rules_task_id_unique").on(table.taskId),
  })
);

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    nameKey: text("name_key").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    profileNameKeyUnique: uniqueIndex("projects_profile_name_key_unique").on(
      table.profileId,
      table.nameKey
    ),
  })
);

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    nameKey: text("name_key").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    profileNameKeyUnique: uniqueIndex("tags_profile_name_key_unique").on(
      table.profileId,
      table.nameKey
    ),
  })
);

export const taskTags = sqliteTable(
  "task_tags",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    taskTagUnique: uniqueIndex("task_tags_task_id_tag_id_unique").on(table.taskId, table.tagId),
  })
);

export const taskOccurrenceLogs = sqliteTable(
  "task_occurrence_logs",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    scheduledFor: text("scheduled_for").notNull(),
    completedAt: text("completed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    taskDateUnique: uniqueIndex("task_occurrence_logs_task_date_unique").on(
      table.taskId,
      table.scheduledFor
    ),
  })
);

export const taskActionUndos = sqliteTable("task_action_undos", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull(),
  kind: text("kind", {
    enum: ["complete", "archive", "restore", "reopen", "delete"],
  }).notNull(),
  payload: text("payload").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  householdMembers: many(householdMembers),
  projects: many(projects),
  tags: many(tags),
  tasks: many(tasks),
}));

export const householdMembersRelations = relations(
  householdMembers,
  ({ one, many }) => ({
    profile: one(profiles, {
      fields: [householdMembers.profileId],
      references: [profiles.id],
    }),
    tasks: many(tasks),
  })
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [tasks.profileId],
    references: [profiles.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(householdMembers, {
    fields: [tasks.assigneeMemberId],
    references: [householdMembers.id],
  }),
  recurrenceRule: one(recurrenceRules, {
    fields: [tasks.id],
    references: [recurrenceRules.taskId],
  }),
  taskTags: many(taskTags),
  occurrenceLogs: many(taskOccurrenceLogs),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [projects.profileId],
    references: [profiles.id],
  }),
  tasks: many(tasks),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [tags.profileId],
    references: [profiles.id],
  }),
  taskTags: many(taskTags),
}));

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, {
    fields: [taskTags.taskId],
    references: [tasks.id],
  }),
  tag: one(tags, {
    fields: [taskTags.tagId],
    references: [tags.id],
  }),
}));

export const recurrenceRulesRelations = relations(
  recurrenceRules,
  ({ one }) => ({
    task: one(tasks, {
      fields: [recurrenceRules.taskId],
      references: [tasks.id],
    }),
  })
);

export const taskOccurrenceLogsRelations = relations(
  taskOccurrenceLogs,
  ({ one }) => ({
    task: one(tasks, {
      fields: [taskOccurrenceLogs.taskId],
      references: [tasks.id],
    }),
  })
);

export type ProfileRecord = typeof profiles.$inferSelect;
export type NewProfileRecord = typeof profiles.$inferInsert;
export type HouseholdMemberRecord = typeof householdMembers.$inferSelect;
export type NewHouseholdMemberRecord = typeof householdMembers.$inferInsert;
export type TaskRecord = typeof tasks.$inferSelect;
export type NewTaskRecord = typeof tasks.$inferInsert;
export type ProjectRecord = typeof projects.$inferSelect;
export type NewProjectRecord = typeof projects.$inferInsert;
export type TagRecord = typeof tags.$inferSelect;
export type NewTagRecord = typeof tags.$inferInsert;
export type TaskTagRecord = typeof taskTags.$inferSelect;
export type NewTaskTagRecord = typeof taskTags.$inferInsert;
export type RecurrenceRuleRecord = typeof recurrenceRules.$inferSelect;
export type NewRecurrenceRuleRecord = typeof recurrenceRules.$inferInsert;
export type TaskOccurrenceLogRecord = typeof taskOccurrenceLogs.$inferSelect;
export type TaskActionUndoRecord = typeof taskActionUndos.$inferSelect;
