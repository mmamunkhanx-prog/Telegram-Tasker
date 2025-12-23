import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertTaskSchema, depositSchema, withdrawSchema } from "@shared/schema";

// Admin Telegram ID - only this user can access admin features
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || "1991771063";

// Middleware to require admin access
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await storage.getUser(userId);
  
  if (!user || !user.isAdmin || user.telegramId !== ADMIN_TELEGRAM_ID) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

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

      // Check if this is the admin user
      const isAdmin = telegramId === ADMIN_TELEGRAM_ID;

      // Check if user exists
      let user = await storage.getUserByTelegramId(telegramId);

      if (!user) {
        // Create new user
        let referredBy: string | undefined;
        let referralBonusPending = false;
        
        if (referralCode) {
          const referrer = await storage.getUserByReferralCode(referralCode);
          if (referrer) {
            referredBy = referrer.id;
            // Mark referral bonus as pending - will be credited after channel verification
            referralBonusPending = true;
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
          referralBonusPending,
          referralBonusCredited: false,
          isAdmin,
        });
      } else {
        // Update isAdmin status on every login to ensure it's current
        if (user.isAdmin !== isAdmin) {
          user = await storage.updateUser(user.id, { isAdmin }) || user;
        }
      }

      res.json(user);
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Verify referral channel join and credit bonus
  // Official channel: @hiddenn_channel
  const REFERRAL_CHANNEL = "@hiddenn_channel";
  const REFERRAL_BONUS = 2; // 2 BDT bonus

  app.post("/api/referral/verify-channel", async (req, res) => {
    console.log("=== VERIFY REFERRAL CHANNEL ===");
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if bonus already credited
      if (user.referralBonusCredited) {
        return res.json({ 
          success: true, 
          alreadyVerified: true,
          message: "Referral bonus already credited" 
        });
      }

      // Check if user has a referrer (came via referral)
      if (!user.referredBy || !user.referralBonusPending) {
        return res.json({ 
          success: false, 
          message: "No pending referral bonus" 
        });
      }

      // Verify channel membership using Telegram Bot API
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      
      if (!botToken) {
        console.log("No bot token - cannot verify channel membership");
        return res.status(503).json({ 
          error: "Channel verification service unavailable. Please try again later." 
        });
      }
      
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(REFERRAL_CHANNEL)}&user_id=${user.telegramId}`
        );
        
        const data = await response.json();
        console.log("Channel membership check:", data);
        
        if (!data.ok) {
          return res.json({ 
            success: false, 
            error: "Could not verify channel membership",
            needsJoin: true,
            channelLink: `https://t.me/${REFERRAL_CHANNEL.replace("@", "")}`
          });
        }

        const status = data.result?.status;
        const isMember = ["creator", "administrator", "member", "restricted"].includes(status);
        
        if (!isMember) {
          return res.json({ 
            success: false, 
            message: "Please join the channel first",
            needsJoin: true,
            channelLink: `https://t.me/${REFERRAL_CHANNEL.replace("@", "")}`
          });
        }
      } catch (err) {
        console.error("Telegram API error:", err);
        return res.status(500).json({ error: "Failed to verify channel membership" });
      }

      // Credit bonus to referrer
      const referrer = await storage.getUser(user.referredBy);
      if (referrer) {
        await storage.updateUser(referrer.id, {
          balance: referrer.balance + REFERRAL_BONUS,
        });
        await storage.createTransaction({
          userId: referrer.id,
          type: "referral_bonus",
          amount: REFERRAL_BONUS,
          status: "approved",
          note: `Referral bonus from ${user.firstName}`,
        });
        console.log(`Credited ${REFERRAL_BONUS} BDT to referrer ${referrer.id}`);
      }

      // Mark bonus as credited
      await storage.updateUser(user.id, {
        referralBonusPending: false,
        referralBonusCredited: true,
      });

      res.json({ 
        success: true, 
        message: "Channel verified! Your friend earned 2 BDT bonus.",
        bonusCredited: true
      });
    } catch (error) {
      console.error("Referral verification error:", error);
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
    console.log("=== POST /api/tasks ===");
    console.log("Request body:", req.body);
    
    try {
      const { creatorId, ...taskData } = req.body;
      console.log("Creator ID:", creatorId);
      console.log("Task data:", taskData);
      
      // Validate creatorId is provided
      if (!creatorId) {
        console.log("Missing creatorId!");
        return res.status(400).json({ error: "creatorId is required" });
      }
      
      const validated = insertTaskSchema.parse(taskData);
      console.log("Validated data:", validated);
      
      // Check if user exists
      const user = await storage.getUser(creatorId);
      console.log("User found:", user);
      
      if (!user) {
        console.log("User not found!");
        return res.status(400).json({ error: "User not found" });
      }
      
      // Admin bypass for testing (Telegram ID 1991771063)
      const isAdmin = user.telegramId === ADMIN_TELEGRAM_ID;
      console.log("Is admin:", isAdmin);
      
      if (user.balance < validated.totalBudget && !isAdmin) {
        console.log("Insufficient balance:", user.balance, "<", validated.totalBudget);
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
        titleBn: validated.titleBn || null,
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

      // Get user's Telegram ID for verification
      const user = await storage.getUser(userId);
      if (!user) {
        return res.json({ success: false, error: "User not found" });
      }

      // Verify membership using Telegram Bot API
      let isVerified = false;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      
      if (botToken) {
        try {
          const channelUsername = task.channelUsername.startsWith("@") 
            ? task.channelUsername 
            : `@${task.channelUsername}`;
          
          const response = await fetch(
            `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(channelUsername)}&user_id=${user.telegramId}`
          );
          const data = await response.json();
          
          if (data.ok && data.result) {
            const status = data.result.status;
            // Member statuses that count as "joined"
            isVerified = ["creator", "administrator", "member"].includes(status);
          }
        } catch (error) {
          console.error("Telegram API error:", error);
          // Fall back to simulated verification if API fails
          isVerified = Math.random() > 0.3;
        }
      } else {
        // No bot token configured, use simulated verification
        isVerified = Math.random() > 0.3;
      }

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

        // Add reward to user (user already fetched above)
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

  // Admin routes - all require admin middleware
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/pending-deposits", requireAdmin, async (req, res) => {
    try {
      const deposits = await storage.getPendingDeposits();
      res.json(deposits);
    } catch (error) {
      console.error("Error fetching pending deposits:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/pending-withdrawals", requireAdmin, async (req, res) => {
    try {
      const withdrawals = await storage.getPendingWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      console.error("Error fetching pending withdrawals:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/transactions/:id/approve", requireAdmin, async (req, res) => {
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

  app.post("/api/admin/transactions/:id/reject", requireAdmin, async (req, res) => {
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

  // ==================== TELEGRAM BOT WEBHOOK ====================
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const MINI_APP_URL = "https://telegram-tasker--mamunkhann.replit.app";
  const CHANNEL_USERNAME = "hiddenn_channel";
  const CHANNEL_LINK = `https://t.me/${CHANNEL_USERNAME}`;
  const BOT_USERNAME = "Promot_ebot";

  // Telegram Bot Webhook Handler
  app.post("/api/telegram/webhook", async (req, res) => {
    try {
      const update = req.body;
      console.log("Telegram update:", JSON.stringify(update, null, 2));

      if (!BOT_TOKEN) {
        console.error("No TELEGRAM_BOT_TOKEN configured");
        return res.sendStatus(200);
      }

      // Handle /start command
      if (update.message?.text?.startsWith("/start")) {
        const chatId = update.message.chat.id;
        const userId = update.message.from.id.toString();
        const firstName = update.message.from.first_name || "User";
        
        // Extract referral code if present
        const startParam = update.message.text.split(" ")[1];
        
        // Store referral info in user record if they exist
        if (startParam) {
          const existingUser = await storage.getUserByTelegramId(userId);
          if (!existingUser) {
            // User will be created when they open the mini app
            console.log(`New user ${userId} came via referral: ${startParam}`);
          }
        }

        const welcomeMessage = `Welcome, ${firstName}! To start earning, please join our channel and verify. Then you can open the Mini App.`;
        
        const inlineKeyboard = {
          inline_keyboard: [
            [{ text: "Join Channel", url: CHANNEL_LINK }],
            [{ text: "Verify Join", callback_data: `verify_join_${userId}` }],
            [{ text: "Open Mini App", web_app: { url: MINI_APP_URL } }]
          ]
        };

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeMessage,
            reply_markup: inlineKeyboard
          })
        });
      }

      // Handle callback queries (Verify Join button)
      if (update.callback_query) {
        const callbackData = update.callback_query.data;
        const chatId = update.callback_query.message.chat.id;
        const callbackQueryId = update.callback_query.id;

        if (callbackData?.startsWith("verify_join_")) {
          const telegramUserId = callbackData.replace("verify_join_", "");
          
          // Check channel membership
          const memberResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=@${CHANNEL_USERNAME}&user_id=${telegramUserId}`
          );
          const memberData = await memberResponse.json();
          
          console.log("Channel membership check:", memberData);
          
          let responseText = "";
          
          if (memberData.ok) {
            const status = memberData.result?.status;
            const isMember = ["creator", "administrator", "member", "restricted"].includes(status);
            
            if (isMember) {
              // User is a member - check if they have pending referral bonus
              const user = await storage.getUserByTelegramId(telegramUserId);
              
              if (user && user.referralBonusPending && user.referredBy && !user.referralBonusCredited) {
                // Credit referral bonus to referrer
                const referrer = await storage.getUser(user.referredBy);
                if (referrer) {
                  await storage.updateUser(referrer.id, {
                    balance: referrer.balance + 2, // 2 BDT bonus
                  });
                  await storage.createTransaction({
                    userId: referrer.id,
                    type: "referral_bonus",
                    amount: 2,
                    status: "approved",
                    note: `Referral bonus from ${user.firstName}`,
                  });
                  console.log(`Credited 2 BDT to referrer ${referrer.id}`);
                }
                
                // Mark bonus as credited
                await storage.updateUser(user.id, {
                  referralBonusPending: false,
                  referralBonusCredited: true,
                });
                
                responseText = "Verified! You've joined the channel. Your friend earned 2 BDT bonus! Now open the Mini App to start earning.";
              } else {
                responseText = "Verified! You've joined the channel. Now open the Mini App to start earning.";
              }
            } else {
              responseText = "You haven't joined the channel yet. Please click 'Join Channel' first, then try again.";
            }
          } else {
            responseText = "Could not verify. Please make sure you've joined the channel and try again.";
          }

          // Answer the callback query
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              callback_query_id: callbackQueryId,
              text: responseText,
              show_alert: true
            })
          });
        }
      }

      res.sendStatus(200);
    } catch (error) {
      console.error("Telegram webhook error:", error);
      res.sendStatus(200); // Always return 200 to prevent Telegram retries
    }
  });

  // Endpoint to set webhook URL
  app.get("/api/telegram/set-webhook", async (req, res) => {
    try {
      if (!BOT_TOKEN) {
        return res.status(500).json({ error: "No bot token configured" });
      }
      
      const webhookUrl = `${MINI_APP_URL}/api/telegram/webhook`;
      
      const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
      );
      const data = await response.json();
      
      console.log("Set webhook response:", data);
      res.json(data);
    } catch (error) {
      console.error("Error setting webhook:", error);
      res.status(500).json({ error: "Failed to set webhook" });
    }
  });

  return httpServer;
}
