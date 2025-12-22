import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { Wallet } from "lucide-react";

export function BalanceCard() {
  const { user, language } = useApp();
  
  const balance = user?.balance ?? 0;

  return (
    <div data-testid="balance-card" className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Wallet className="w-4 h-4" />
          <span className="text-sm font-medium">{t("mainBalance", language)}</span>
        </div>
        
        <div className="flex items-baseline gap-1">
          <span data-testid="text-balance" className="text-3xl font-bold font-mono text-foreground">
            {balance.toFixed(2)}
          </span>
          <span className="text-lg font-semibold text-muted-foreground">
            {t("bdt", language)}
          </span>
        </div>
      </div>
    </div>
  );
}
