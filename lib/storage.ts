// lib/storage.ts

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch (error) {
      // Le WebView ou le mode privé strict bloque l'accès
      console.warn(`[SafeStorage] localStorage.getItem('${key}') est bloqué par le navigateur`);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn(`[SafeStorage] localStorage.setItem('${key}') est bloqué par le navigateur`);
    }
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`[SafeStorage] localStorage.removeItem('${key}') est bloqué par le navigateur`);
    }
  }
};