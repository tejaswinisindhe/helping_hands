
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'ocean' | 'twilight' | 'forest' | 'system';

type ThemeState = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'ocean',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'helping-hands-theme',
    }
  )
);
