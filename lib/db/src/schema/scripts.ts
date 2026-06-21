import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scriptsTable = pgTable("scripts", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  description: text("description"),
  code: text("code"),
  obfuscatedCode: text("obfuscated_code"),
  scriptKey: text("script_key"),
  service: text("service"),
  provider: text("provider"),
  status: text("status").notNull().default("active"),
  obfuscationStatus: text("obfuscation_status").notNull().default("pending"),
  executions: integer("executions").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failureCount: integer("failure_count").notNull().default(0),
  checkpointUrl: text("checkpoint_url"),
  webhookUrl: text("webhook_url"),
  webhookLogsEnabled: boolean("webhook_logs_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertScriptSchema = createInsertSchema(scriptsTable).omit({
  id: true,
  executions: true,
  successCount: true,
  failureCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Script = typeof scriptsTable.$inferSelect;
