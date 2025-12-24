import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@shared/schema";

export function BannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: banners } = useQuery<Banner[]>({
    queryKey: ["/api/banners"],
  });

  const totalSlides = banners?.length || 0;

  useEffect(() => {
    if (totalSlides === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 4000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  useEffect(() => {
    if (currentIndex >= totalSlides && totalSlides > 0) {
      setCurrentIndex(0);
    }
  }, [totalSlides, currentIndex]);

  const goToPrev = () => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToNext = () => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const handleBannerClick = (redirectLink: string) => {
    if (redirectLink) {
      window.open(redirectLink, "_blank");
    }
  };

  if (!banners || banners.length === 0) {
    return null;
  }

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
              onClick={() => handleBannerClick(banner.redirectLink)}
              className="flex-shrink-0 w-full aspect-[2/1] rounded-xl overflow-hidden cursor-pointer relative"
              data-testid={`banner-item-${banner.id}`}
            >
              <img
                src={banner.imageUrl}
                alt={banner.caption}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-lg font-bold text-white">{banner.caption}</h3>
              </div>
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
