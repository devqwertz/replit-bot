import { pgTable, text, serial, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { scriptsTable } from "./scripts";

export const scriptBansTable = pgTable("script_bans", {
  id: serial("id").primaryKey(),
  scriptId: integer("script_id").notNull().references(() => scriptsTable.id, { onDelete: "cascade" }),
  executorId: text("executor_id").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.scriptId, t.executorId),
]);

export type ScriptBan = typeof scriptBansTable.$inferSelect;
