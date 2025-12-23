import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { hapticFeedback } from "@/lib/telegram";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, ArrowDownCircle, ArrowUpCircle, History } from "lucide-react";
import { DepositForm } from "@/components/DepositForm";
import { WithdrawForm } from "@/components/WithdrawForm";
import { TransactionHistory } from "@/components/TransactionHistory";

export default function Profile() {
  const { user, language } = useApp();
  const [copied, setCopied] = useState(false);

  const referralLink = user
    ? `https://t.me/YourBotUsername?start=${user.referralCode}`
    : "";

  const handleCopyReferral = async () => {
    hapticFeedback("medium");
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16" data-testid="img-avatar">
              <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
                {user?.firstName?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 data-testid="text-user-name" className="font-semibold text-lg">
                {user?.firstName} {user?.lastName || ""}
              </h3>
              {user?.username && (
                <p className="text-muted-foreground">@{user.username}</p>
              )}
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-bold font-mono text-primary">
                  {user?.balance?.toFixed(2) || "0.00"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t("bdt", language)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">{t("referralLink", language)}</label>
            <div className="px-3 py-2 rounded-lg bg-muted text-sm truncate border border-border">
              {referralLink || "Loading..."}
            </div>
            <Button
              variant="default"
              onClick={handleCopyReferral}
              disabled={!referralLink}
              className="w-full"
              data-testid="button-copy-referral"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  {language === "bn" ? "কপি হয়েছে!" : "Copied!"}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  {language === "bn" ? "লিংক কপি করুন" : "Copy Link"}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {language === "bn" 
                ? "বন্ধুকে আমন্ত্রণ জানান এবং ২ BDT বোনাস পান!" 
                : "Invite friends and earn 2 BDT bonus!"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deposit" className="gap-1.5" data-testid="tab-deposit">
            <ArrowDownCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{t("deposit", language)}</span>
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="gap-1.5" data-testid="tab-withdraw">
            <ArrowUpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{t("withdraw", language)}</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5" data-testid="tab-history">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">{t("history", language)}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposit">
          <DepositForm />
        </TabsContent>

        <TabsContent value="withdraw">
          <WithdrawForm />
        </TabsContent>

        <TabsContent value="history">
          <TransactionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
