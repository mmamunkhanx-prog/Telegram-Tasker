import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { Trophy, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@shared/schema";

const rankIcons = [Trophy, Medal, Award];
const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];

export function TopEarners() {
  const { language } = useApp();
  
  const { data: topEarners, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/top-earners"],
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{t("topEarners", language)}</h3>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-card-border">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const earners = topEarners || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          {t("topEarners", language)}
        </h3>
      </div>

      {earners.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No earners yet. Be the first!
        </div>
      ) : (
        <div className="space-y-2">
          {earners.slice(0, 5).map((user, index) => {
            const RankIcon = rankIcons[index] || Award;
            const rankColor = rankColors[index] || "text-muted-foreground";
            
            return (
              <div
                key={user.id}
                data-testid={`leaderboard-item-${index}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-card border border-card-border"
              >
                <div className={`flex items-center justify-center w-8 ${rankColor}`}>
                  {index < 3 ? (
                    <RankIcon className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold text-sm">#{index + 1}</span>
                  )}
                </div>
                
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {user.firstName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {user.firstName} {user.lastName || ""}
                  </p>
                  {user.username && (
                    <p className="text-xs text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  )}
                </div>
                
                <div className="text-right">
                  <span className="font-semibold font-mono text-primary">
                    {user.balance.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {t("bdt", language)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
