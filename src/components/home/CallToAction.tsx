
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

export function CallToAction() {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-ocean-primary via-twilight-primary to-coral opacity-90"></div>
          
          <div className="relative z-10 text-center text-white py-16 px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Make a Difference?</h2>
            <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 mb-8">
              Join our community of changemakers and find meaningful volunteer opportunities today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Button asChild size="lg" variant="secondary" className="bg-white text-twilight-primary hover:bg-white/90">
                    <Link to="/register">Sign Up Now</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                    <Link to="/projects">Browse Projects</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" variant="secondary" className="bg-white text-twilight-primary hover:bg-white/90">
                    <Link to="/dashboard">View Dashboard</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                    <Link to="/projects">Browse Projects</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
