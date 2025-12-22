import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertTaskSchema, depositSchema, withdrawSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth - Telegram auto-login
  app.post("/api/auth/telegram", async (req, res) => {
    try {
      const { telegramId, username, firstName, lastName, photoUrl, referralCode } = req.body;

      if (!telegramId || !firstName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if user exists
      let user = await storage.getUserByTelegramId(telegramId);

      if (!user) {
        // Create new user
        let referredBy: string | undefined;
        if (referralCode) {
          const referrer = await storage.getUserByReferralCode(referralCode);
          if (referrer) {
            referredBy = referrer.id;
            // Give referral bonus to referrer
            await storage.updateUser(referrer.id, {
              balance: referrer.balance + 5,
            });
            await storage.createTransaction({
              userId: referrer.id,
              type: "referral_bonus",
              amount: 5,
              status: "approved",
            });
          }
        }

        user = await storage.createUser({
          telegramId,
          username: username || null,
          firstName,
          lastName: lastName || null,
          photoUrl: photoUrl || null,
          balance: 0,
          referralCode: "",
          referredBy: referredBy || null,
          isAdmin: telegramId === "123456789",
        });
      }

      res.json(user);
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get top earners
  app.get("/api/users/top-earners", async (req, res) => {
    try {
      const topEarners = await storage.getTopEarners(10);
      res.json(topEarners);
    } catch (error) {
      console.error("Error fetching top earners:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all active tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getActiveTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user's task completions
  app.get("/api/tasks/completions", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }
      const completions = await storage.getUserTaskCompletions(userId);
      res.json(completions);
    } catch (error) {
      console.error("Error fetching completions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a new task
  app.post("/api/tasks", async (req, res) => {
    try {
      const { creatorId, ...taskData } = req.body;
      
      const validated = insertTaskSchema.parse(taskData);
      
      // Check if user has enough balance
      const user = await storage.getUser(creatorId);
      if (!user || user.balance < validated.totalBudget) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Deduct balance
      await storage.updateUser(creatorId, {
        balance: user.balance - validated.totalBudget,
      });

      // Create transaction record
      await storage.createTransaction({
        userId: creatorId,
        type: "task_creation",
        amount: validated.totalBudget,
        status: "approved",
      });

      const maxMembers = Math.floor(validated.totalBudget / validated.rewardPerMember);
      const task = await storage.createTask({
        ...validated,
        creatorId,
        remainingBudget: validated.totalBudget,
        completedCount: 0,
        maxMembers,
        isActive: true,
      });

      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Verify task completion
  app.post("/api/tasks/:taskId/verify", async (req, res) => {
    try {
      const { taskId } = req.params;
      const { userId } = req.body;

      const task = await storage.getTask(taskId);
      if (!task || !task.isActive || task.remainingBudget < task.rewardPerMember) {
        return res.json({ success: false, error: "Task not available" });
      }

      // Check if already completed
      const existing = await storage.getTaskCompletion(taskId, userId);
      if (existing?.status === "verified") {
        return res.json({ success: false, error: "Already completed" });
      }

      // In production, call Telegram Bot API to verify membership
      // For demo, simulate 70% success rate
      const isVerified = Math.random() > 0.3;

      if (isVerified) {
        // Update or create completion
        if (existing) {
          await storage.updateTaskCompletion(existing.id, { status: "verified" });
        } else {
          await storage.createTaskCompletion({
            taskId,
            userId,
            status: "verified",
          });
        }

        // Add reward to user
        const user = await storage.getUser(userId);
        if (user) {
          await storage.updateUser(userId, {
            balance: user.balance + task.rewardPerMember,
          });

          // Create transaction
          await storage.createTransaction({
            userId,
            type: "task_earning",
            amount: task.rewardPerMember,
            status: "approved",
          });
        }

        // Update task
        await storage.updateTask(taskId, {
          remainingBudget: task.remainingBudget - task.rewardPerMember,
          completedCount: task.completedCount + 1,
          isActive: task.remainingBudget - task.rewardPerMember > 0,
        });

        return res.json({ success: true });
      } else {
        if (existing) {
          await storage.updateTaskCompletion(existing.id, { status: "failed" });
        } else {
          await storage.createTaskCompletion({
            taskId,
            userId,
            status: "failed",
          });
        }
        return res.json({ success: false, error: "Not a member of the channel" });
      }
    } catch (error) {
      console.error("Error verifying task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Submit deposit request
  app.post("/api/transactions/deposit", async (req, res) => {
    try {
      const { userId, ...depositData } = req.body;
      const validated = depositSchema.parse(depositData);

      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        amount: validated.amount,
        method: validated.method,
        transactionId: validated.transactionId,
        status: "pending",
      });

      res.json(transaction);
    } catch (error) {
      console.error("Error creating deposit:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Submit withdrawal request
  app.post("/api/transactions/withdraw", async (req, res) => {
    try {
      const { userId, ...withdrawData } = req.body;
      const validated = withdrawSchema.parse(withdrawData);

      // Check if user has enough balance
      const user = await storage.getUser(userId);
      if (!user || user.balance < validated.amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Deduct balance immediately
      await storage.updateUser(userId, {
        balance: user.balance - validated.amount,
      });

      const transaction = await storage.createTransaction({
        userId,
        type: "withdraw",
        amount: validated.amount,
        method: validated.method,
        walletAddress: validated.walletAddress,
        status: "pending",
      });

      res.json(transaction);
    } catch (error) {
      console.error("Error creating withdrawal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/pending-deposits", async (req, res) => {
    try {
      const deposits = await storage.getPendingDeposits();
      res.json(deposits);
    } catch (error) {
      console.error("Error fetching pending deposits:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/pending-withdrawals", async (req, res) => {
    try {
      const withdrawals = await storage.getPendingWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      console.error("Error fetching pending withdrawals:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/transactions/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.body;

      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      await storage.updateTransaction(id, { status: "approved" });

      // If deposit, add to user balance
      if (transaction.type === "deposit") {
        const user = await storage.getUser(transaction.userId);
        if (user) {
          await storage.updateUser(user.id, {
            balance: user.balance + transaction.amount,
          });
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error approving transaction:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/transactions/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.body;

      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      await storage.updateTransaction(id, { status: "rejected" });

      // If withdrawal was rejected, refund the balance
      if (transaction.type === "withdraw") {
        const user = await storage.getUser(transaction.userId);
        if (user) {
          await storage.updateUser(user.id, {
            balance: user.balance + transaction.amount,
          });
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
