import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Gift, Loader2, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import type { AppSettings } from "@shared/schema";

export function DailyCheckin() {
  const { language, user, setUser } = useApp();
  const { toast } = useToast();
  const [timeUntilClaim, setTimeUntilClaim] = useState<string>("");
  const [canClaim, setCanClaim] = useState(false);

  const { data: settings } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  const dailyReward = settings?.dailyCheckinReward ?? 1;

  useEffect(() => {
    if (!user?.dailyCheckinLastClaimed) {
      setCanClaim(true);
      setTimeUntilClaim("");
      return;
    }

    const lastClaimed = new Date(user.dailyCheckinLastClaimed).getTime();
    const now = Date.now();
    const nextClaimTime = lastClaimed + 24 * 60 * 60 * 1000;

    if (now >= nextClaimTime) {
      setCanClaim(true);
      setTimeUntilClaim("");
    } else {
      setCanClaim(false);
      const interval = setInterval(() => {
        const remaining = nextClaimTime - Date.now();
        if (remaining <= 0) {
          setCanClaim(true);
          setTimeUntilClaim("");
          clearInterval(interval);
        } else {
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          setTimeUntilClaim(`${hours}h ${minutes}m`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [user?.dailyCheckinLastClaimed]);

  const claimMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/users/daily-checkin", { userId: user?.id });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to claim reward");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t("success", language),
        description: t("claimDaily", language),
      });
      if (user) {
        setUser({
          ...user,
          balance: data.newBalance || user.balance + dailyReward,
          dailyCheckinLastClaimed: new Date() as any,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("error", language),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="relative overflow-visible border-reward/20 bg-gradient-to-r from-card via-card to-reward/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-reward/20 to-reward/5 flex items-center justify-center flex-shrink-0 shadow-md">
            <Gift className="w-6 h-6 text-reward" />
            {canClaim && (
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-reward animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">{t("dailyCheckin", language)}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {canClaim ? (
                <span className="text-reward font-medium">+{dailyReward} BDT {t("claimDaily", language)}</span>
              ) : (
                `${t("nextClaimIn", language)}: ${timeUntilClaim}`
              )}
            </p>
          </div>
          <Button
            onClick={() => claimMutation.mutate()}
            disabled={!canClaim || claimMutation.isPending}
            data-testid="button-daily-checkin"
            className={`w-full max-w-[100px] shadow-md ${
              canClaim 
                ? "bg-reward text-black font-semibold" 
                : ""
            }`}
          >
            {claimMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : canClaim ? (
              t("claimReward", language)
            ) : (
              t("claimedToday", language)
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
