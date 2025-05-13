
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { MainLayout } from "@/components/layout/MainLayout";

// Lazy load pages
const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Create a QueryClient instance
const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route element={<MainLayout />}>
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route path="/projects" element={<ProjectsPage />} />
                
                {/* Protected routes */}
                <Route path="/schedule" element={
                  <ProtectedRoute>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold">My Schedule</h1>
                      <p className="text-muted-foreground">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                } />
                
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold">Messages</h1>
                      <p className="text-muted-foreground">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                } />
                
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold">Analytics</h1>
                      <p className="text-muted-foreground">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold">Settings</h1>
                      <p className="text-muted-foreground">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold">Profile</h1>
                      <p className="text-muted-foreground">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
