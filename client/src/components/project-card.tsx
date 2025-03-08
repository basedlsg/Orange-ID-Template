import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye, Sparkles } from "lucide-react";
import { SiX } from "react-icons/si";
import type { Project } from "@shared/schema";
import defaultThumbnail from "../logocode.png";

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

  const handleXClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://x.com/${project.xHandle}`, "_blank");
  };

  const handleSponsorshipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.sponsorshipUrl) {
      window.open(project.sponsorshipUrl, "_blank");
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg bg-black border-zinc-800">
      <div className="aspect-video overflow-hidden bg-zinc-900">
        <img
          src={project.thumbnail || defaultThumbnail}
          alt={project.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <CardTitle className="text-white">{project.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="mb-4 text-sm text-zinc-400">{project.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.sponsorshipEnabled && (
            <Badge
              variant="secondary"
              className="bg-purple-500/10 text-purple-400 cursor-pointer"
              onClick={handleSponsorshipClick}
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Open for Sponsorship
            </Badge>
          )}
          {/* Display genres first */}
          {project.genres?.map((genre) => (
            <Badge
              key={genre}
              variant="secondary"
              className="bg-green-500/10 text-green-400"
            >
              {genre}
            </Badge>
          ))}
          {/* Then display AI tools */}
          {project.aiTools.map((tool) => (
            <Badge
              key={tool}
              variant="secondary"
              className="bg-blue-500/10 text-blue-400"
            >
              {tool}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{project.views}</span>
            </div>
            {project.xHandle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleXClick}
                className="text-zinc-400 hover:text-blue-400 p-0 h-auto z-30"
              >
                <SiX className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 z-10"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Visit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}