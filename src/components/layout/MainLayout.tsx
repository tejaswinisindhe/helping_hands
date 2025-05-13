
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useAuthStore } from "@/store/authStore";
import { useIsMobile } from "@/hooks/use-mobile";

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="flex h-screen overflow-hidden">
      {isAuthenticated && (
        <Sidebar 
          open={sidebarOpen} 
          setOpen={setSidebarOpen} 
        />
      )}
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          showToggle={isAuthenticated}
        />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
