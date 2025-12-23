import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownCircle, ArrowUpCircle, Gift, Coins, Users } from "lucide-react";
import type { Transaction } from "@shared/schema";

const typeIcons: Record<string, typeof ArrowDownCircle> = {
  deposit: ArrowDownCircle,
  withdraw: ArrowUpCircle,
  task_earning: Gift,
  task_creation: Coins,
  referral_bonus: Users,
};

const typeLabels: Record<string, string> = {
  deposit: "Deposit",
  withdraw: "Withdraw",
  task_earning: "Task Earning",
  task_creation: "Task Created",
  referral_bonus: "Referral Bonus",
};

export function TransactionHistory() {
  const { language, user } = useApp();

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?userId=${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return t("approved", language);
      case "pending":
        return t("pending", language);
      case "rejected":
        return t("rejected", language);
      default:
        return status;
    }
  };

  const formatDate = (dateValue: Date | string | number) => {
    const date = new Date(dateValue);
    return date.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("transactionHistory", language)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("transactionHistory", language)}</CardTitle>
      </CardHeader>
      <CardContent>
        {!transactions || transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("noTransactions", language)}
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const Icon = typeIcons[tx.type] || ArrowDownCircle;
              const isPositive = ["deposit", "task_earning", "referral_bonus"].includes(tx.type);
              
              return (
                <div
                  key={tx.id}
                  data-testid={`transaction-item-${tx.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {typeLabels[tx.type] || tx.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-semibold font-mono text-sm ${
                      isPositive ? "text-green-500" : "text-red-500"
                    }`}>
                      {isPositive ? "+" : "-"}{tx.amount.toFixed(2)}
                    </p>
                    <Badge variant={getStatusVariant(tx.status)} className="text-xs">
                      {getStatusLabel(tx.status)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
