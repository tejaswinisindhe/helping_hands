
import { createContext, useEffect } from "react";
import { useThemeStore, ThemeName } from "@/store/themeStore";

export const ThemeContext = createContext<{
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}>({
  theme: 'system',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (theme === 'system') {
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', false);
    }
    
    // Set theme-specific CSS variables
    document.documentElement.style.setProperty(
      '--primary', 
      theme === 'ocean' ? '173 92% 32%' :
      theme === 'twilight' ? '262 83% 58%' :
      theme === 'forest' ? '158 84% 32%' : '262 83% 58%' // default to twilight
    );
    
    document.documentElement.style.setProperty(
      '--secondary', 
      theme === 'ocean' ? '193 91% 38%' :
      theme === 'twilight' ? '231 91% 51%' :
      theme === 'forest' ? '152 60% 36%' : '231 91% 51%'
    );
    
    document.documentElement.style.setProperty(
      '--accent', 
      theme === 'ocean' ? '198 93% 59%' :
      theme === 'twilight' ? '271 91% 65%' :
      theme === 'forest' ? '142 76% 45%' : '271 91% 65%'
    );
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        document.documentElement.classList.toggle(
          "dark",
          mediaQuery.matches
        );
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
