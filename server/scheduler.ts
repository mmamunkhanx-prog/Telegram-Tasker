import cron from "node-cron";
import { storage } from "./storage";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const REFERRAL_CHANNEL = "@hiddenn_channel";

export function initializeScheduler() {
  // Run retention check every hour at the start of the hour
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("[Scheduler] Running hourly retention check...");
      const startTime = Date.now();
      
      const pendingChecks = await storage.getPendingRetentionChecks();
      
      const results = {
        checked: 0,
        deducted: 0,
        retained: 0,
        insufficientBalance: 0,
        errors: 0,
      };

      for (const completion of pendingChecks) {
        try {
          const task = await storage.getTask(completion.taskId);
          const user = await storage.getUser(completion.userId);
          
          if (!task || !user) {
            await storage.updateTaskCompletion(completion.id, { retentionChecked: true });
            results.errors++;
            continue;
          }

          // Determine which channel to check
          const channelToCheck = task.channelUsername.startsWith("@") 
            ? task.channelUsername 
            : `@${task.channelUsername}`;

          // Check if user is still a member using Telegram Bot API
          let isMember = false;
          if (BOT_TOKEN) {
            try {
              const response = await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(channelToCheck)}&user_id=${user.telegramId}`
              );
              const data = await response.json();
              
              if (data.ok && data.result) {
                const status = data.result.status;
                isMember = ["creator", "administrator", "member"].includes(status);
              }
            } catch (error) {
              console.error(`[Scheduler] Error checking membership for user ${user.id}:`, error);
              results.errors++;
              continue;
            }
          } else {
            // No bot token configured - skip this check
            await storage.updateTaskCompletion(completion.id, { retentionChecked: true });
            results.errors++;
            continue;
          }

          if (isMember) {
            // User is still a member, mark as retention checked
            await storage.updateTaskCompletion(completion.id, { retentionChecked: true });
            results.retained++;
          } else {
            // User left the channel - deduct the reward
            const deductAmount = completion.rewardAmount || task.rewardPerMember;
            
            // Check if this was a referral task (checking @hiddenn_channel)
            const isReferralTask = channelToCheck.toLowerCase() === REFERRAL_CHANNEL.toLowerCase();
            
            let deductFromUserId = completion.userId;
            let deductNote = `Deduction: Left ${channelToCheck} early`;
            
            if (isReferralTask && user.referredBy) {
              // This was a referral verification - deduct from the referrer
              deductFromUserId = user.referredBy;
              deductNote = `Deduction: Referral ${user.firstName} left ${channelToCheck} early`;
            }

            const deductUser = await storage.getUser(deductFromUserId);
            if (deductUser && deductUser.balance >= deductAmount) {
              // Deduct balance
              await storage.updateUser(deductFromUserId, {
                balance: deductUser.balance - deductAmount,
              });

              // Create deduction transaction (positive amount - UI handles display)
              await storage.createTransaction({
                userId: deductFromUserId,
                type: "deduction",
                amount: deductAmount,
                status: "approved",
                note: deductNote,
              });

              // Mark as deducted
              await storage.updateTaskCompletion(completion.id, { 
                retentionChecked: true,
                deducted: true,
              });

              // Send notification to user via Telegram
              try {
                const notifyUser = isReferralTask && user.referredBy ? deductUser : user;
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: notifyUser.telegramId,
                    text: `⚠️ ${deductAmount} BDT deducted from your balance.\n\nReason: ${deductNote}\n\nPlease stay in channels for at least 48 hours to keep your rewards.`,
                  }),
                });
              } catch (e) {
                console.error("[Scheduler] Failed to send deduction notification:", e);
              }

              results.deducted++;
            } else {
              // User doesn't have enough balance - mark as checked and deducted to prevent reprocessing
              await storage.updateTaskCompletion(completion.id, { 
                retentionChecked: true,
                deducted: true, // Mark as deducted to prevent reprocessing loop
              });
              results.insufficientBalance++;
            }
          }
          
          results.checked++;
        } catch (error) {
          console.error(`[Scheduler] Error processing retention check for completion ${completion.id}:`, error);
          results.errors++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[Scheduler] Retention check completed in ${duration}ms:`, results);
    } catch (error) {
      console.error("[Scheduler] Error running retention check:", error);
    }
  });

  console.log("[Scheduler] Initialized - retention check will run hourly");
}
