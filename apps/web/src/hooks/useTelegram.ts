import { useEffect, useState } from 'react';

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    enable: () => void;
    disable: () => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    button_color?: string;
    hint_color?: string;
  };
  sendData: (data: string) => void;
  isExpanded: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Window {
    Telegram?: Record<string, unknown>;
  }
}

function getTelegramWebApp(): TelegramWebApp | null {
  const tg = window.Telegram;
  if (!tg || typeof tg !== 'object') return null;
  const webApp = (tg as Record<string, unknown>).WebApp;
  if (!webApp || typeof webApp !== 'object') return null;
  return webApp as TelegramWebApp;
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.ready();
      tg.expand();
      setWebApp(tg);
      setIsMiniApp(true);

      if (tg.themeParams.bg_color) {
        document.documentElement.style.setProperty('--tg-bg-color', tg.themeParams.bg_color);
      }
      if (tg.themeParams.text_color) {
        document.documentElement.style.setProperty('--tg-text-color', tg.themeParams.text_color);
      }
      if (tg.themeParams.button_color) {
        document.documentElement.style.setProperty('--tg-button-color', tg.themeParams.button_color);
      }
    }
  }, []);

  return { webApp, isMiniApp };
}
