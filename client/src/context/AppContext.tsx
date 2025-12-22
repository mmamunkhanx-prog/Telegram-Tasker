import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@shared/schema";
import { type Language } from "@/lib/i18n";
import { getTelegramUser, getStartParam, initTelegram } from "@/lib/telegram";
import { apiRequest } from "@/lib/queryClient";

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initTelegram();
    
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang) {
      setLanguage(savedLang);
    }
    
    autoLogin();
  }, []);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  async function autoLogin() {
    const telegramUser = getTelegramUser();
    if (!telegramUser) {
      setIsLoading(false);
      return;
    }

    try {
      const referralCode = getStartParam();
      const response = await apiRequest("POST", "/api/auth/telegram", {
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        photoUrl: telegramUser.photo_url,
        referralCode,
      });
      
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error("Auto-login failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppContext.Provider value={{ user, setUser, language, setLanguage, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
