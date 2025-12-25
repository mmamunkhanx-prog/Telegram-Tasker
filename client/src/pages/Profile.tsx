import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { hapticFeedback } from "@/lib/telegram";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, ArrowDownCircle, ArrowUpCircle, History, Wallet, Users } from "lucide-react";
import { DepositForm } from "@/components/DepositForm";
import { WithdrawForm } from "@/components/WithdrawForm";
import { TransactionHistory } from "@/components/TransactionHistory";

export default function Profile() {
  const { user, language } = useApp();
  const [copied, setCopied] = useState(false);

  const referralLink = user
    ? `https://t.me/Promot_ebot?start=${user.referralCode}`
    : "";

  const handleCopyReferral = async () => {
    hapticFeedback("medium");
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/30 shadow-lg" data-testid="img-avatar">
              <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                {user?.firstName?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 data-testid="text-user-name" className="font-bold text-lg text-foreground">
                {user?.firstName} {user?.lastName || ""}
              </h3>
              {user?.username && (
                <p className="text-muted-foreground text-sm">@{user.username}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Wallet className="w-4 h-4" />
                <span className="text-xs font-medium">{t("mainBalance", language)}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-primary">
                  {user?.balance?.toFixed(2) || "0.00"}
                </span>
                <span className="text-xs text-muted-foreground">{t("bdt", language)}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium">{language === "bn" ? "রেফারেল বোনাস" : "Referral Bonus"}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-reward">5</span>
                <span className="text-xs text-muted-foreground">{t("bdt", language)}/invite</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-reward" />
              <label className="text-sm font-semibold">{t("referralLink", language)}</label>
            </div>
            <div className="px-4 py-3 rounded-xl bg-muted/50 text-sm font-mono truncate border border-border">
              {referralLink || "Loading..."}
            </div>
            <Button
              variant="default"
              onClick={handleCopyReferral}
              disabled={!referralLink}
              className="w-full shadow-md"
              data-testid="button-copy-referral"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-400" />
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
                ? "বন্ধুকে আমন্ত্রণ জানান এবং ৫ BDT বোনাস পান!" 
                : "Invite friends and earn 5 BDT bonus!"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-border p-1 rounded-xl">
          <TabsTrigger value="deposit" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-deposit">
            <ArrowDownCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{t("deposit", language)}</span>
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-withdraw">
            <ArrowUpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{t("withdraw", language)}</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-history">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">{t("history", language)}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="mt-4">
          <DepositForm />
        </TabsContent>

        <TabsContent value="withdraw" className="mt-4">
          <WithdrawForm />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <TransactionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
