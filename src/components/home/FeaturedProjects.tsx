
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/projectStore";
import { ProjectCard } from "@/components/projects/ProjectCard";

export function FeaturedProjects() {
  const { projects, fetchProjects, loading } = useProjectStore();
  
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  
  // Get 3 featured projects (in a real app, you might have a "featured" flag)
  const featuredProjects = projects.slice(0, 3);

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Featured Projects</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Discover opportunities to make a difference in your community. These featured projects need your help right now.
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-lg bg-muted animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Button asChild>
                <Link to="/projects">View All Projects</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
