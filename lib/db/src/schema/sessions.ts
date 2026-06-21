import { pgTable, text, serial, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { scriptsTable } from "./scripts";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  scriptId: integer("script_id").notNull().references(() => scriptsTable.id, { onDelete: "cascade" }),
  executorId: text("executor_id").notNull(),
  robloxUserId: text("roblox_user_id"),
  robloxUsername: text("roblox_username"),
  robloxClientId: text("roblox_client_id"),
  robloxThumbnailUrl: text("roblox_thumbnail_url"),
  robloxPlaceId: text("roblox_place_id"),
  robloxJobId: text("roblox_job_id"),
  robloxExecutor: text("roblox_executor"),
  country: text("country"),
  countryCode: text("country_code"),
  lastPingAt: timestamp("last_ping_at", { withTimezone: true }).notNull().defaultNow(),
  pendingNotification: text("pending_notification"),
}, (t) => [
  unique().on(t.scriptId, t.executorId),
]);

export type Session = typeof sessionsTable.$inferSelect;
