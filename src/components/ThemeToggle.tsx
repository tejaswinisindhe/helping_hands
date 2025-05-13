
import { Moon, Sun, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemeStore, ThemeName } from "@/store/themeStore";

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const themes: { value: ThemeName; label: string; icon: React.ReactNode }[] = [
    {
      value: "ocean",
      label: "Ocean",
      icon: <div className="h-4 w-4 rounded-full bg-ocean-primary" />,
    },
    {
      value: "twilight",
      label: "Twilight",
      icon: <div className="h-4 w-4 rounded-full bg-twilight-primary" />,
    },
    {
      value: "forest",
      label: "Forest",
      icon: <div className="h-4 w-4 rounded-full bg-forest-primary" />,
    },
    {
      value: "system",
      label: "System",
      icon: <Laptop className="h-4 w-4" />,
    },
  ];

  const currentTheme = themes.find((t) => t.value === theme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Select theme">
          {theme === "system" ? (
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          ) : (
            currentTheme?.icon || <Sun className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => setTheme(themeOption.value)}
            className="flex items-center gap-2 cursor-pointer"
          >
            {themeOption.icon}
            <span>{themeOption.label}</span>
            {theme === themeOption.value && (
              <span className="ml-auto text-xs text-primary">Active</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
