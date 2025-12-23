import { BalanceCard } from "@/components/BalanceCard";
import { BannerSlider } from "@/components/BannerSlider";
import { DailyCheckin } from "@/components/DailyCheckin";
import { ReferralVerification } from "@/components/ReferralVerification";

export default function Home() {
  return (
    <div className="space-y-6 pb-4">
      <BalanceCard />
      <DailyCheckin />
      <ReferralVerification />
      <BannerSlider />
    </div>
  );
}
