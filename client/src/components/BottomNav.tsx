import { useLocation, Link } from "wouter";
import { Home, ListTodo, PlusCircle, User } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { hapticFeedback } from "@/lib/telegram";

const navItems = [
  { path: "/", icon: Home, labelKey: "home" as const },
  { path: "/tasks", icon: ListTodo, labelKey: "tasks" as const },
  { path: "/create", icon: PlusCircle, labelKey: "createNav" as const },
  { path: "/profile", icon: User, labelKey: "profile" as const },
];

export function BottomNav() {
  const [location] = useLocation();
  const { language } = useApp();

  const handleNavClick = () => {
    hapticFeedback("light");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/50 z-50 safe-area-bottom shadow-lg">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ path, icon: Icon, labelKey }) => {
          const isActive = location === path;
          return (
            <Link
              key={path}
              href={path}
              onClick={handleNavClick}
              data-testid={`nav-${labelKey}`}
            >
              <div
                className={`relative flex flex-col items-center justify-center gap-1 px-5 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>
                  {t(labelKey, language)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
