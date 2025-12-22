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
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
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
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                <span className={`text-xs ${isActive ? "font-semibold" : "font-medium"}`}>
                  {t(labelKey, language)}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
