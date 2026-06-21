import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { scriptsTable } from "./scripts";

export const userKeysTable = pgTable("user_keys", {
  id: serial("id").primaryKey(),
  scriptId: integer("script_id").notNull().references(() => scriptsTable.id, { onDelete: "cascade" }),
  scriptKey: text("script_key").notNull(),
  keyValue: text("key_value").notNull().unique(),
  hwid: text("hwid"),
  hwidLocked: boolean("hwid_locked").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserKey = typeof userKeysTable.$inferSelect;
