import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { scriptsTable } from "./scripts";

export const executionLogsTable = pgTable("execution_logs", {
  id: serial("id").primaryKey(),
  scriptId: integer("script_id").notNull().references(() => scriptsTable.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  executorId: text("executor_id").notNull(),
  robloxUsername: text("roblox_username"),
  robloxUserId: text("roblox_user_id"),
  robloxClientId: text("roblox_client_id"),
  robloxThumbnailUrl: text("roblox_thumbnail_url"),
  robloxExecutor: text("roblox_executor"),
  duration: integer("duration"),
  country: text("country"),
  countryCode: text("country_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertExecutionLogSchema = createInsertSchema(executionLogsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertExecutionLog = z.infer<typeof insertExecutionLogSchema>;
export type ExecutionLog = typeof executionLogsTable.$inferSelect;
