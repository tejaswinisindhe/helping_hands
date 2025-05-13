
import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { type Project } from "@/store/projectStore";
import { formatDate } from "@/lib/date-format";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const progressPercentage = Math.round((project.filledSpots / project.spots) * 100);
  
  const defaultImage = "/placeholder.svg";

  return (
    <Card 
      className={`overflow-hidden transition-all duration-500 card-hover ${
        isHovered ? "transform-gpu scale-[1.02]" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={project.image || defaultImage}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-500"
          style={{
            transform: isHovered ? "scale(1.05)" : "scale(1)",
          }}
        />
        <div className="absolute top-0 right-0 p-2">
          <Badge className="bg-ocean-primary">{project.spots - project.filledSpots} spots left</Badge>
        </div>
      </div>
      
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold mb-1 line-clamp-1">
            {project.title}
          </h3>
        </div>
        
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {project.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            <span className="truncate">{project.location}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>
              {formatDate(project.startDate)}
              {project.startDate !== project.endDate && ` - ${formatDate(project.endDate)}`}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-2 h-4 w-4" />
            <div className="w-full">
              <div className="flex justify-between mb-1">
                <span>{project.filledSpots} volunteers</span>
                <span className="text-xs">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    progressPercentage > 80 ? "bg-forest-primary" : 
                    progressPercentage > 40 ? "bg-ocean-primary" : "bg-coral"
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-3">
          {project.skills.slice(0, 2).map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {project.skills.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{project.skills.length - 2} more
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button asChild className="w-full group">
          <Link to={`/projects/${project.id}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
