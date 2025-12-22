import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const banners = [
  {
    id: "1",
    gradient: "from-blue-600 via-blue-500 to-cyan-400",
    title: "Earn by Joining",
    subtitle: "Complete tasks & get paid instantly",
  },
  {
    id: "2",
    gradient: "from-purple-600 via-purple-500 to-pink-400",
    title: "Create Tasks",
    subtitle: "Promote your Telegram channel",
  },
  {
    id: "3",
    gradient: "from-green-600 via-green-500 to-emerald-400",
    title: "Refer & Earn",
    subtitle: "Get bonus for every referral",
  },
];

export function BannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div data-testid="banner-slider" className="relative">
      <div className="overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`flex-shrink-0 w-full aspect-[2/1] bg-gradient-to-r ${banner.gradient} rounded-xl flex flex-col items-center justify-center p-6`}
            >
              <h3 className="text-xl font-bold text-white mb-1">{banner.title}</h3>
              <p className="text-white/80 text-sm">{banner.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={goToPrev}
        data-testid="button-banner-prev"
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80 transition-opacity"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={goToNext}
        data-testid="button-banner-next"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80 transition-opacity"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="flex justify-center gap-1.5 mt-3">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            data-testid={`button-banner-dot-${index}`}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? "bg-primary w-6"
                : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
