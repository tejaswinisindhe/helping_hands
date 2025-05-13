
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ParticleBackground } from "@/components/particles/ParticleBackground";
import { useAuthStore } from "@/store/authStore";

export function HeroSection() {
  const [animateItems, setAnimateItems] = useState<boolean>(false);
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => {
      setAnimateItems(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-[80vh] flex items-center">
      <ParticleBackground />
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className={`transform transition-all duration-1000 ${
            animateItems ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-ocean-primary via-twilight-primary to-coral">
                Connect, Volunteer, Make an Impact
              </span>
            </h1>
            
            <p className="text-lg md:text-xl mb-8 text-muted-foreground">
              Join EchoMate to discover volunteer opportunities that match your skills 
              and interests. Make a difference in your community today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Button asChild size="lg" className="animate-float">
                    <Link to="/register">Get Started</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/projects">Browse Projects</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="animate-float">
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/projects">Browse Projects</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 transform transition-all duration-1000 delay-300 ${
          animateItems ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}>
          <div className="bg-card text-card-foreground rounded-lg p-6 shadow-md hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-full bg-ocean-primary/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-ocean-primary">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Find Opportunities</h3>
            <p className="text-muted-foreground">
              Discover volunteer opportunities that match your skills, interests and schedule.
            </p>
          </div>
          
          <div className="bg-card text-card-foreground rounded-lg p-6 shadow-md hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-full bg-twilight-primary/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-twilight-primary">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect with Causes</h3>
            <p className="text-muted-foreground">
              Join organizations making real impact and connect with other passionate volunteers.
            </p>
          </div>
          
          <div className="bg-card text-card-foreground rounded-lg p-6 shadow-md hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-full bg-coral/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-coral">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Track Your Impact</h3>
            <p className="text-muted-foreground">
              See the difference you're making with detailed impact tracking and achievements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
