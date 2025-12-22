import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.string(),
  telegramId: z.string(),
  username: z.string().optional(),
  firstName: z.string(),
  lastName: z.string().optional(),
  photoUrl: z.string().optional(),
  balance: z.number().default(0),
  referralCode: z.string(),
  referredBy: z.string().optional(),
  isAdmin: z.boolean().default(false),
  createdAt: z.number(),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = Omit<User, "id">;

// Task schema
export const taskSchema = z.object({
  id: z.string(),
  creatorId: z.string(),
  title: z.string(),
  titleBn: z.string().optional(),
  channelUsername: z.string(),
  channelLink: z.string(),
  rewardPerMember: z.number().min(0.5),
  totalBudget: z.number(),
  remainingBudget: z.number(),
  completedCount: z.number().default(0),
  maxMembers: z.number(),
  isActive: z.boolean().default(true),
  createdAt: z.number(),
});

export type Task = z.infer<typeof taskSchema>;
export type InsertTask = Omit<Task, "id">;

export const insertTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  titleBn: z.string().optional(),
  channelUsername: z.string().min(1, "Channel username is required"),
  channelLink: z.string().url("Must be a valid URL"),
  rewardPerMember: z.number().min(0.5, "Minimum reward is 0.5 BDT"),
  totalBudget: z.number().min(1, "Budget must be at least 1 BDT"),
});

// Task completion schema
export const taskCompletionSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  status: z.enum(["pending", "verified", "failed"]),
  createdAt: z.number(),
});

export type TaskCompletion = z.infer<typeof taskCompletionSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["deposit", "withdraw", "task_earning", "task_creation", "referral_bonus"]),
  amount: z.number(),
  status: z.enum(["pending", "approved", "rejected"]),
  method: z.enum(["bkash", "nagad", "usdt"]).optional(),
  walletAddress: z.string().optional(),
  transactionId: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.number(),
});

export type Transaction = z.infer<typeof transactionSchema>;
export type InsertTransaction = Omit<Transaction, "id">;

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

// Banner schema
export const bannerSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  link: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number(),
});

export type Banner = z.infer<typeof bannerSchema>;

// Admin stats
export const adminStatsSchema = z.object({
  totalUsers: z.number(),
  totalDeposits: z.number(),
  totalWithdrawals: z.number(),
  pendingDeposits: z.number(),
  pendingWithdrawals: z.number(),
  activeTasks: z.number(),
});

export type AdminStats = z.infer<typeof adminStatsSchema>;
