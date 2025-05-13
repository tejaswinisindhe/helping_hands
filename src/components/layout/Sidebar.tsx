
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Home,
  Search,
  Calendar,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation();
  const isMobile = useIsMobile();

  const routes = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: Home,
    },
    {
      name: "Browse Projects",
      path: "/projects",
      icon: Search,
    },
    {
      name: "My Schedule",
      path: "/schedule",
      icon: Calendar,
    },
    {
      name: "Messages",
      path: "/messages",
      icon: MessageSquare,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: BarChart3,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside
      className={cn(
        "bg-sidebar relative z-10 flex h-full w-full flex-col border-r border-border shadow-sm transition-all duration-300",
        isMobile
          ? open
            ? "fixed inset-0"
            : "hidden"
          : open
          ? "md:w-64"
          : "md:w-16"
      )}
    >
      {isMobile && (
        <div className="flex items-center justify-end p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className={cn("flex h-14 items-center px-4", !open && "justify-center")}>
        {open ? (
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-ocean-primary to-ocean-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="font-bold text-lg animate-fade-in">Helping Hands</span>
          </Link>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-ocean-primary to-ocean-accent flex items-center justify-center">
            <span className="text-white font-bold text-lg">H</span>
          </div>
        )}

        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            className="absolute right-[-12px] top-[20px] h-6 w-6 rounded-full border border-border bg-background"
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            {open ? (
              <ChevronLeft className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="grid gap-1 px-2">
          {routes.map((route) => (
            <Link
              key={route.path}
              to={route.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                isActive(route.path) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                !open && "justify-center px-0"
              )}
              onClick={() => isMobile && setOpen(false)}
            >
              <route.icon className={cn("h-5 w-5", open ? "" : "h-5 w-5")} />
              {open && <span>{route.name}</span>}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
