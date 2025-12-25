import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { Wallet, TrendingUp } from "lucide-react";

export function BalanceCard() {
  const { user, language } = useApp();
  
  const balance = user?.balance ?? 0;

  return (
    <div data-testid="balance-card" className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 via-card to-card border border-primary/20 p-6 shadow-lg">
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium">{t("mainBalance", language)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            <span>Active</span>
          </div>
        </div>
        
        <div className="flex items-baseline gap-2">
          <span data-testid="text-balance" className="text-4xl font-bold font-mono text-foreground tracking-tight">
            {balance.toFixed(2)}
          </span>
          <span className="text-lg font-semibold text-primary">
            {t("bdt", language)}
          </span>
        </div>
      </div>
    </div>
  );
}
