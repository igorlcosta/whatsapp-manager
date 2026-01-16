import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * WhatsApp numbers table for managing rotation and cooldown.
 */
export const whatsappNumbers = mysqlTable("whatsapp_numbers", {
  id: int("id").autoincrement().primaryKey(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull().unique(),
  displayName: varchar("display_name", { length: 50 }),
  status: mysqlEnum("status", ["available", "cooldown", "blocked"]).default("available").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  lastContactCount: int("last_contact_count").default(0),
  totalUseCount: int("total_use_count").default(0).notNull(), // Contador de quantas vezes foi usado
  blockedUntil: timestamp("blocked_until"),
  isSensitive: int("is_sensitive").default(0).notNull(), // 0 = false, 1 = true (boolean as int)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappNumber = typeof whatsappNumbers.$inferSelect;
export type InsertWhatsappNumber = typeof whatsappNumbers.$inferInsert;

/**
 * Usage history table for tracking all number usage events.
 */
export const usageHistory = mysqlTable("usage_history", {
  id: int("id").autoincrement().primaryKey(),
  numberId: int("number_id").notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  contactCount: int("contact_count").notNull().default(45),
  usedAt: timestamp("used_at").defaultNow().notNull(),
  notes: text("notes"),
  wasBlocked: int("was_blocked").default(0).notNull(), // 0 = false, 1 = true
});

export type UsageHistory = typeof usageHistory.$inferSelect;
export type InsertUsageHistory = typeof usageHistory.$inferInsert;