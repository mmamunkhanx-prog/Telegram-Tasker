import { LanguageToggle } from "./LanguageToggle";
import { SiTelegram } from "react-icons/si";

export function Header() {
  return (
    <header data-testid="header" className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <SiTelegram className="w-6 h-6 text-primary" />
          <span data-testid="text-app-title" className="font-semibold text-lg">TaskEarn</span>
        </div>
        <LanguageToggle />
      </div>
    </header>
  );
}
