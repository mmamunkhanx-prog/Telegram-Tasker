import { BalanceCard } from "@/components/BalanceCard";
import { BannerSlider } from "@/components/BannerSlider";
import { TopEarners } from "@/components/TopEarners";

export default function Home() {
  return (
    <div className="space-y-6 pb-4">
      <BalanceCard />
      <BannerSlider />
      <TopEarners />
    </div>
  );
}
