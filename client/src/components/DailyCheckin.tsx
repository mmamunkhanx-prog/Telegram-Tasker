import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Calendar, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export function DailyCheckin() {
  const { language, user, setUser } = useApp();
  const { toast } = useToast();
  const [timeUntilClaim, setTimeUntilClaim] = useState<string>("");
  const [canClaim, setCanClaim] = useState(false);

  // Check if user can claim
  useEffect(() => {
    if (!user?.dailyCheckinLastClaimed) {
      setCanClaim(true);
      setTimeUntilClaim("");
      return;
    }

    const lastClaimed = new Date(user.dailyCheckinLastClaimed).getTime();
    const now = Date.now();
    const nextClaimTime = lastClaimed + 24 * 60 * 60 * 1000; // 24 hours

    if (now >= nextClaimTime) {
      setCanClaim(true);
      setTimeUntilClaim("");
    } else {
      setCanClaim(false);
      // Calculate countdown
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
          balance: user.balance + 1,
          dailyCheckinLastClaimed: new Date() as any,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{t("dailyCheckin", language)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {canClaim
                ? t("claimDaily", language)
                : `${t("nextClaimIn", language)}: ${timeUntilClaim}`}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => claimMutation.mutate()}
            disabled={!canClaim || claimMutation.isPending}
            data-testid="button-daily-checkin"
          >
            {claimMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
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
