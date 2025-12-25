import { BalanceCard } from "@/components/BalanceCard";
import { BannerSlider } from "@/components/BannerSlider";
import { DailyCheckin } from "@/components/DailyCheckin";
import { ReferralVerification } from "@/components/ReferralVerification";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";

export default function Home() {
  const { language, user } = useApp();

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">
            {language === "bn" ? "স্বাগতম" : "Welcome back"}
          </p>
          <h1 className="text-xl font-bold text-foreground">
            {user?.firstName || "User"}
          </h1>
        </div>
      </div>

      <BalanceCard />
      
      <DailyCheckin />
      
      <ReferralVerification />
      
      <BannerSlider />
    </div>
  );
}
