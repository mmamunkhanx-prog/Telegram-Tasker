import WebApp from "@twa-dev/sdk";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export function initTelegram() {
  try {
    WebApp.ready();
    WebApp.expand();
    WebApp.setHeaderColor("#1a1a2e");
    WebApp.setBackgroundColor("#1a1a2e");
  } catch (e) {
    console.log("Telegram WebApp not available (running in browser)");
  }
}

export function getTelegramUser(): TelegramUser | null {
  try {
    const user = WebApp.initDataUnsafe?.user;
    if (user) {
      return user as TelegramUser;
    }
  } catch (e) {
    console.log("Could not get Telegram user");
  }
  
  // Return mock user for development
  if (import.meta.env.DEV) {
    return {
      id: 123456789,
      first_name: "Test",
      last_name: "User",
      username: "testuser",
      photo_url: undefined,
      language_code: "en",
    };
  }
  
  return null;
}

export function getStartParam(): string | null {
  try {
    return WebApp.initDataUnsafe?.start_param || null;
  } catch (e) {
    return null;
  }
}

export function openTelegramLink(url: string) {
  try {
    WebApp.openTelegramLink(url);
  } catch (e) {
    window.open(url, "_blank");
  }
}

export function showAlert(message: string) {
  try {
    WebApp.showAlert(message);
  } catch (e) {
    alert(message);
  }
}

export function hapticFeedback(type: "light" | "medium" | "heavy" = "light") {
  try {
    WebApp.HapticFeedback.impactOccurred(type);
  } catch (e) {
    // Haptic feedback not available
  }
}
