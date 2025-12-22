import { randomUUID } from "crypto";
import type {
  User,
  InsertUser,
  Task,
  InsertTask,
  TaskCompletion,
  Transaction,
  InsertTransaction,
  AdminStats,
} from "@shared/schema";

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
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;

  // Task Completions
  getTaskCompletion(taskId: string, userId: string): Promise<TaskCompletion | undefined>;
  getUserTaskCompletions(userId: string): Promise<TaskCompletion[]>;
  createTaskCompletion(completion: Omit<TaskCompletion, "id">): Promise<TaskCompletion>;
  updateTaskCompletion(id: string, updates: Partial<TaskCompletion>): Promise<TaskCompletion | undefined>;

  // Transactions
  getTransaction(id: string): Promise<Transaction | undefined>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
  getPendingDeposits(): Promise<Transaction[]>;
  getPendingWithdrawals(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;

  // Admin
  getAdminStats(): Promise<AdminStats>;
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tasks: Map<string, Task>;
  private taskCompletions: Map<string, TaskCompletion>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.taskCompletions = new Map();
    this.transactions = new Map();

    // Seed some demo data
    this.seedData();
  }

  private seedData() {
    // Create a demo admin user
    const adminUser: User = {
      id: "admin-1",
      telegramId: "123456789",
      username: "testuser",
      firstName: "Test",
      lastName: "User",
      photoUrl: undefined,
      balance: 1000,
      referralCode: "ADMIN1",
      referredBy: undefined,
      isAdmin: true,
      createdAt: Date.now(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create some demo users for leaderboard
    const demoUsers: User[] = [
      { id: "user-1", telegramId: "111", firstName: "Rahim", lastName: "Khan", username: "rahim_k", balance: 520.50, referralCode: "RAHIM1", isAdmin: false, createdAt: Date.now() - 86400000 },
      { id: "user-2", telegramId: "222", firstName: "Fatima", lastName: "Ahmed", username: "fatima_a", balance: 385.25, referralCode: "FATIM1", isAdmin: false, createdAt: Date.now() - 172800000 },
      { id: "user-3", telegramId: "333", firstName: "Karim", lastName: "Hassan", username: "karim_h", balance: 275.00, referralCode: "KARIM1", isAdmin: false, createdAt: Date.now() - 259200000 },
      { id: "user-4", telegramId: "444", firstName: "Nadia", username: "nadia_s", balance: 150.75, referralCode: "NADIA1", isAdmin: false, createdAt: Date.now() - 345600000 },
      { id: "user-5", telegramId: "555", firstName: "Tanvir", lastName: "Islam", username: "tanvir_i", balance: 95.00, referralCode: "TANVI1", isAdmin: false, createdAt: Date.now() - 432000000 },
    ];
    demoUsers.forEach(u => this.users.set(u.id, u));

    // Create some demo tasks
    const demoTasks: Task[] = [
      {
        id: "task-1",
        creatorId: "user-1",
        title: "Join Tech News Channel",
        titleBn: "টেক নিউজ চ্যানেলে যোগ দিন",
        channelUsername: "technewsbd",
        channelLink: "https://t.me/technewsbd",
        rewardPerMember: 1.0,
        totalBudget: 100,
        remainingBudget: 85,
        completedCount: 15,
        maxMembers: 100,
        isActive: true,
        createdAt: Date.now() - 86400000,
      },
      {
        id: "task-2",
        creatorId: "user-2",
        title: "Subscribe to Crypto Updates",
        titleBn: "ক্রিপ্টো আপডেট সাবস্ক্রাইব করুন",
        channelUsername: "cryptoupdatesbd",
        channelLink: "https://t.me/cryptoupdatesbd",
        rewardPerMember: 0.5,
        totalBudget: 50,
        remainingBudget: 45,
        completedCount: 10,
        maxMembers: 100,
        isActive: true,
        createdAt: Date.now() - 172800000,
      },
      {
        id: "task-3",
        creatorId: "user-3",
        title: "Join Gaming Community",
        titleBn: "গেমিং কমিউনিটিতে যোগ দিন",
        channelUsername: "gamingbd",
        channelLink: "https://t.me/gamingbd",
        rewardPerMember: 2.0,
        totalBudget: 200,
        remainingBudget: 180,
        completedCount: 10,
        maxMembers: 100,
        isActive: true,
        createdAt: Date.now() - 259200000,
      },
    ];
    demoTasks.forEach(t => this.tasks.set(t.id, t));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.telegramId === telegramId);
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.referralCode === code);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      referralCode: insertUser.referralCode || generateReferralCode(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async getTopEarners(limit: number): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getActiveTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((t) => t.isActive && t.remainingBudget > 0)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const maxMembers = Math.floor(insertTask.totalBudget / insertTask.rewardPerMember);
    const task: Task = {
      ...insertTask,
      id,
      remainingBudget: insertTask.totalBudget,
      completedCount: 0,
      maxMembers,
      isActive: true,
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const updated = { ...task, ...updates };
    this.tasks.set(id, updated);
    return updated;
  }

  // Task Completions
  async getTaskCompletion(taskId: string, userId: string): Promise<TaskCompletion | undefined> {
    return Array.from(this.taskCompletions.values()).find(
      (tc) => tc.taskId === taskId && tc.userId === userId
    );
  }

  async getUserTaskCompletions(userId: string): Promise<TaskCompletion[]> {
    return Array.from(this.taskCompletions.values()).filter((tc) => tc.userId === userId);
  }

  async createTaskCompletion(completion: Omit<TaskCompletion, "id">): Promise<TaskCompletion> {
    const id = randomUUID();
    const taskCompletion: TaskCompletion = { ...completion, id };
    this.taskCompletions.set(id, taskCompletion);
    return taskCompletion;
  }

  async updateTaskCompletion(id: string, updates: Partial<TaskCompletion>): Promise<TaskCompletion | undefined> {
    const tc = this.taskCompletions.get(id);
    if (!tc) return undefined;
    const updated = { ...tc, ...updates };
    this.taskCompletions.set(id, updated);
    return updated;
  }

  // Transactions
  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async getPendingDeposits(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((t) => t.type === "deposit" && t.status === "pending")
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async getPendingWithdrawals(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((t) => t.type === "withdraw" && t.status === "pending")
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = { ...insertTransaction, id };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const tx = this.transactions.get(id);
    if (!tx) return undefined;
    const updated = { ...tx, ...updates };
    this.transactions.set(id, updated);
    return updated;
  }

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    const allUsers = Array.from(this.users.values());
    const allTransactions = Array.from(this.transactions.values());
    const allTasks = Array.from(this.tasks.values());

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
}

export const storage = new MemStorage();
