import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  telegramId: varchar("telegram_id", { length: 50 }).notNull().unique(),
  username: varchar("username", { length: 100 }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }),
  photoUrl: text("photo_url"),
  balance: real("balance").notNull().default(0),
  referralCode: varchar("referral_code", { length: 20 }).notNull().unique(),
  referredBy: varchar("referred_by", { length: 36 }),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id", { length: 36 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  titleBn: varchar("title_bn", { length: 200 }),
  channelUsername: varchar("channel_username", { length: 100 }).notNull(),
  channelLink: text("channel_link").notNull(),
  rewardPerMember: real("reward_per_member").notNull(),
  totalBudget: real("total_budget").notNull(),
  remainingBudget: real("remaining_budget").notNull(),
  completedCount: integer("completed_count").notNull().default(0),
  maxMembers: integer("max_members").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  creatorId: true, // Handled separately in API
  remainingBudget: true,
  completedCount: true,
  maxMembers: true,
  isActive: true,
}).extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  channelUsername: z.string().min(1, "Channel username is required"),
  channelLink: z.string().url("Must be a valid URL"),
  rewardPerMember: z.number().min(0.5, "Minimum reward is 0.5 BDT"),
  totalBudget: z.number().min(1, "Budget must be at least 1 BDT"),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Task completions table
export const taskCompletions = pgTable("task_completions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskCompletionSchema = createInsertSchema(taskCompletions).omit({
  id: true,
  createdAt: true,
});

export type InsertTaskCompletion = z.infer<typeof insertTaskCompletionSchema>;
export type TaskCompletion = typeof taskCompletions.$inferSelect;

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  amount: real("amount").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  method: varchar("method", { length: 20 }),
  walletAddress: text("wallet_address"),
  transactionId: varchar("transaction_id", { length: 100 }),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Validation schemas for API
export const depositSchema = z.object({
  amount: z.number().min(10, "Minimum deposit is 10 BDT"),
  method: z.enum(["bkash", "nagad", "usdt"]),
  transactionId: z.string().min(1, "Transaction ID is required"),
});

export const withdrawSchema = z.object({
  amount: z.number().min(50, "Minimum withdrawal is 50 BDT"),
  method: z.enum(["bkash", "nagad", "usdt"]),
  walletAddress: z.string().min(1, "Wallet address is required"),
});

// Admin stats type
export interface AdminStats {
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  activeTasks: number;
}
