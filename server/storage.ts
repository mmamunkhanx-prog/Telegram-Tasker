import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  users,
  tasks,
  taskCompletions,
  transactions,
  banners,
  appSettings,
  type User,
  type InsertUser,
  type Task,
  type InsertTask,
  type TaskCompletion,
  type InsertTaskCompletion,
  type Transaction,
  type InsertTransaction,
  type Banner,
  type InsertBanner,
  type AppSettings,
  type InsertAppSettings,
  type AdminStats,
} from "@shared/schema";

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getTopEarners(limit: number): Promise<User[]>;
  getAllUsers(): Promise<User[]>;

  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;
  getActiveTasks(): Promise<Task[]>;
  createTask(task: Omit<Task, "id" | "createdAt">): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;

  // Task Completions
  getTaskCompletion(taskId: string, userId: string): Promise<TaskCompletion | undefined>;
  getUserTaskCompletions(userId: string): Promise<TaskCompletion[]>;
  createTaskCompletion(completion: InsertTaskCompletion): Promise<TaskCompletion>;
  updateTaskCompletion(id: string, updates: Partial<TaskCompletion>): Promise<TaskCompletion | undefined>;
  getPendingRetentionChecks(): Promise<TaskCompletion[]>;

  // Transactions
  getTransaction(id: string): Promise<Transaction | undefined>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
  getPendingDeposits(): Promise<Transaction[]>;
  getPendingWithdrawals(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;

  // Admin
  getAdminStats(): Promise<AdminStats>;

  // Banners
  getAllBanners(): Promise<Banner[]>;
  getActiveBanners(): Promise<Banner[]>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  deleteBanner(id: string): Promise<boolean>;

  // App Settings
  getAppSettings(): Promise<AppSettings>;
  updateAppSettings(updates: Partial<InsertAppSettings>): Promise<AppSettings>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const referralCode = insertUser.referralCode || generateReferralCode();
    const [user] = await db.insert(users).values({
      ...insertUser,
      referralCode,
    }).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getTopEarners(limit: number): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.balance)).limit(limit);
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getAllTasks(): Promise<Task[]> {
    return db.select().from(tasks);
  }

  async getActiveTasks(): Promise<Task[]> {
    return db.select().from(tasks)
      .where(and(eq(tasks.isActive, true), sql`${tasks.remainingBudget} > 0`))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(taskData: Omit<Task, "id" | "createdAt">): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return task;
  }

  // Task Completions
  async getTaskCompletion(taskId: string, userId: string): Promise<TaskCompletion | undefined> {
    const [completion] = await db.select().from(taskCompletions)
      .where(and(eq(taskCompletions.taskId, taskId), eq(taskCompletions.userId, userId)));
    return completion;
  }

  async getUserTaskCompletions(userId: string): Promise<TaskCompletion[]> {
    return db.select().from(taskCompletions).where(eq(taskCompletions.userId, userId));
  }

  async createTaskCompletion(completion: InsertTaskCompletion): Promise<TaskCompletion> {
    const [tc] = await db.insert(taskCompletions).values(completion).returning();
    return tc;
  }

  async updateTaskCompletion(id: string, updates: Partial<TaskCompletion>): Promise<TaskCompletion | undefined> {
    const [tc] = await db.update(taskCompletions).set(updates).where(eq(taskCompletions.id, id)).returning();
    return tc;
  }

  async getPendingRetentionChecks(): Promise<TaskCompletion[]> {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    return db.select().from(taskCompletions)
      .where(and(
        eq(taskCompletions.status, "verified"),
        eq(taskCompletions.retentionChecked, false),
        eq(taskCompletions.deducted, false),
        sql`${taskCompletions.verifiedAt} IS NOT NULL`,
        sql`${taskCompletions.verifiedAt} <= ${fortyEightHoursAgo}`
      ));
  }

  // Transactions
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
    return tx;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getPendingDeposits(): Promise<Transaction[]> {
    return db.select().from(transactions)
      .where(and(eq(transactions.type, "deposit"), eq(transactions.status, "pending")))
      .orderBy(transactions.createdAt);
  }

  async getPendingWithdrawals(): Promise<Transaction[]> {
    return db.select().from(transactions)
      .where(and(eq(transactions.type, "withdraw"), eq(transactions.status, "pending")))
      .orderBy(transactions.createdAt);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [tx] = await db.insert(transactions).values(transaction).returning();
    return tx;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [tx] = await db.update(transactions).set(updates).where(eq(transactions.id, id)).returning();
    return tx;
  }

  // Admin Stats
  async getAdminStats(): Promise<AdminStats> {
    const allUsers = await db.select().from(users);
    const allTransactions = await db.select().from(transactions);
    const allTasks = await db.select().from(tasks);

    return {
      totalUsers: allUsers.length,
      totalDeposits: allTransactions
        .filter((t) => t.type === "deposit" && t.status === "approved")
        .reduce((sum, t) => sum + t.amount, 0),
      totalWithdrawals: allTransactions
        .filter((t) => t.type === "withdraw" && t.status === "approved")
        .reduce((sum, t) => sum + t.amount, 0),
      pendingDeposits: allTransactions.filter((t) => t.type === "deposit" && t.status === "pending").length,
      pendingWithdrawals: allTransactions.filter((t) => t.type === "withdraw" && t.status === "pending").length,
      activeTasks: allTasks.filter((t) => t.isActive).length,
    };
  }

  // Banners
  async getAllBanners(): Promise<Banner[]> {
    return db.select().from(banners).orderBy(desc(banners.createdAt));
  }

  async getActiveBanners(): Promise<Banner[]> {
    return db.select().from(banners)
      .where(eq(banners.isActive, true))
      .orderBy(desc(banners.createdAt));
  }

  async createBanner(banner: InsertBanner): Promise<Banner> {
    const [newBanner] = await db.insert(banners).values(banner).returning();
    return newBanner;
  }

  async deleteBanner(id: string): Promise<boolean> {
    const result = await db.delete(banners).where(eq(banners.id, id));
    return true;
  }

  // App Settings
  async getAppSettings(): Promise<AppSettings> {
    const [settings] = await db.select().from(appSettings).where(eq(appSettings.id, "default"));
    
    if (!settings) {
      // Create default settings if not exists
      const [newSettings] = await db.insert(appSettings).values({
        id: "default",
        referralBonusAmount: 5,
        minWithdrawAmount: 50,
        minDepositAmount: 10,
        dailyCheckinReward: 1,
      }).returning();
      return newSettings;
    }
    
    return settings;
  }

  async updateAppSettings(updates: Partial<InsertAppSettings>): Promise<AppSettings> {
    // Ensure settings exist first
    const existing = await this.getAppSettings();
    
    if (!existing) {
      throw new Error("Failed to initialize app settings");
    }
    
    const [updatedSettings] = await db.update(appSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appSettings.id, "default"))
      .returning();
    
    if (!updatedSettings) {
      throw new Error("Failed to update app settings");
    }
    
    return updatedSettings;
  }
}

export const storage = new DatabaseStorage();
