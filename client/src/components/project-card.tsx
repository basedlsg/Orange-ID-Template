import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye } from "lucide-react";
import type { Project } from "@shared/schema";

interface ProjectCardProps {
  project: Project;
  onView?: () => void;
}

export function ProjectCard({ project, onView }: ProjectCardProps) {
  const handleClick = async () => {
    if (onView) {
      onView();
    }
    window.open(project.url, "_blank");
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg bg-black border-zinc-800">
      <div className="aspect-video overflow-hidden bg-zinc-900">
        <img
          src={project.thumbnail || "https://images.unsplash.com/photo-1531297484001-80022131f5a1"}
          alt={project.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg text-white">{project.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="mb-4 text-sm text-zinc-400">{project.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.aiTools.map((tool) => (
            <Badge key={tool} variant="secondary" className="bg-blue-500/10 text-blue-400">
              {tool}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Eye className="h-4 w-4" />
            <span>{project.views}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClick}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Visit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}