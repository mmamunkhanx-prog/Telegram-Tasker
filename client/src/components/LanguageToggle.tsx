import { useApp } from "@/context/AppContext";
import { hapticFeedback } from "@/lib/telegram";

export function LanguageToggle() {
  const { language, setLanguage } = useApp();

  const toggleLanguage = () => {
    hapticFeedback("light");
    setLanguage(language === "en" ? "bn" : "en");
  };

  return (
    <button
      onClick={toggleLanguage}
      data-testid="button-language-toggle"
      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary/50 border border-border text-sm font-medium transition-colors"
    >
      <span className={language === "en" ? "text-primary font-semibold" : "text-muted-foreground"}>
        EN
      </span>
      <span className="text-muted-foreground">|</span>
      <span className={language === "bn" ? "text-primary font-semibold" : "text-muted-foreground"}>
        বাং
      </span>
    </button>
  );
}
