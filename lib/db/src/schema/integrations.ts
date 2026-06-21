import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const integrationsTable = pgTable("integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  publisherId: text("publisher_id").notNull().default(""),
  antiBypassToken: text("anti_bypass_token").notNull().default(""),
  bypassProtection: boolean("bypass_protection").notNull().default(false),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
