
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { useProjectStore } from "@/store/projectStore";
import { Search, X } from "lucide-react";

export default function ProjectsPage() {
  const { projects, loading, filters, setFilters, resetFilters, fetchProjects } = useProjectStore();
  const [searchText, setSearchText] = useState(filters.search);
  
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchText });
  };
  
  const handleReset = () => {
    resetFilters();
    setSearchText("");
  };
  
  const allSkills = Array.from(new Set(projects.flatMap(project => project.skills)));
  const allLocations = Array.from(new Set(projects.map(project => project.location)));
  
  // Filter projects based on search, skills, and location
  const filteredProjects = projects.filter(project => {
    const matchesSearch = !filters.search || 
      project.title.toLowerCase().includes(filters.search.toLowerCase()) || 
      project.description.toLowerCase().includes(filters.search.toLowerCase());
      
    const matchesSkills = filters.skills.length === 0 || 
      filters.skills.some(skill => project.skills.includes(skill));
      
    const matchesLocation = !filters.location || 
      project.location.toLowerCase().includes(filters.location.toLowerCase());
      
    return matchesSearch && matchesSkills && matchesLocation;
  });

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Volunteer Projects</h1>
          <p className="text-muted-foreground">Find opportunities to make a difference</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex w-full md:w-auto mt-4 md:mt-0">
          <div className="relative flex-grow md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects..."
              className="pl-8"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute right-2.5 top-2.5"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button type="submit" className="ml-2">Search</Button>
        </form>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters sidebar */}
        <div className="lg:w-1/4 space-y-6">
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Filters</h2>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-sm h-8">
                Reset
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Location</h3>
                <div className="space-y-1 max-h-40 overflow-auto">
                  {allLocations.map((location) => (
                    <div key={location} className="flex items-center">
                      <input
                        type="radio"
                        id={`location-${location}`}
                        checked={filters.location === location}
                        onChange={() => setFilters({ location })}
                        className="mr-2"
                      />
                      <label htmlFor={`location-${location}`} className="text-sm cursor-pointer">
                        {location}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Skills</h3>
                <div className="flex flex-wrap gap-1">
                  {allSkills.map((skill) => {
                    const isActive = filters.skills.includes(skill);
                    return (
                      <Badge
                        key={skill}
                        variant={isActive ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const newSkills = isActive
                            ? filters.skills.filter((s) => s !== skill)
                            : [...filters.skills, skill];
                          setFilters({ skills: newSkills });
                        }}
                      >
                        {skill}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Projects grid */}
        <div className="lg:w-3/4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 rounded-lg bg-muted animate-pulse"></div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
              <Button onClick={handleReset} className="mt-4">
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
