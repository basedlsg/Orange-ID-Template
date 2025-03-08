import { ProjectCard } from "./project-card";
import type { Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useBedrockPassport } from "@bedrock_org/passport";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import { LoginDialog } from "./login-dialog";
import { Badge } from "@/components/ui/badge";
import { PREDEFINED_GENRES, PREDEFINED_AI_TOOLS } from "@shared/schema";

interface ProjectGridProps {
  projects: Project[];
  onProjectView?: (id: number) => void;
}

export function ProjectGrid({ projects, onProjectView }: ProjectGridProps) {
  const { toast } = useToast();
  const { isLoggedIn } = useBedrockPassport();
  const [, setLocation] = useLocation();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const handleView = async (project: Project) => {
    try {
      await apiRequest("POST", `/api/projects/${project.id}/view`);
      if (onProjectView) {
        onProjectView(project.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record view",
        variant: "destructive",
      });
    }
  };

  const handleSubmitClick = () => {
    if (!isLoggedIn) {
      sessionStorage.setItem("returnPath", "/submit");
      setShowLoginDialog(true);
    } else {
      setLocation("/submit");
    }
  };

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(selectedGenre === genre ? null : genre);
    setSelectedTool(null); // Reset tool filter when selecting genre
  };

  const handleToolClick = (tool: string) => {
    setSelectedTool(selectedTool === tool ? null : tool);
    setSelectedGenre(null); // Reset genre filter when selecting tool
  };

  const filteredProjects = projects.filter(project => {
    if (selectedGenre) {
      return project.genres?.includes(selectedGenre);
    }
    if (selectedTool) {
      return project.aiTools.includes(selectedTool);
    }
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="space-y-4 mb-6">
        {/* Genre Filter */}
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-2">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_GENRES.map((genre) => (
              <Badge
                key={genre}
                variant="secondary"
                className={`cursor-pointer ${
                  selectedGenre === genre 
                    ? 'bg-green-500 text-white' 
                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                }`}
                onClick={() => handleGenreClick(genre)}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        {/* AI Tools Filter */}
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-2">AI Tools</h3>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_AI_TOOLS.map((tool) => (
              <Badge
                key={tool}
                variant="secondary"
                className={`cursor-pointer ${
                  selectedTool === tool 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                }`}
                onClick={() => handleToolClick(tool)}
              >
                {tool}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card 
          className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg bg-black border-zinc-800 border-dashed h-full"
          onClick={handleSubmitClick}
        >
          <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="rounded-full bg-blue-500/10 p-4 mb-4">
              <Plus className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Submit Project</h3>
            <p className="text-sm text-zinc-400">Share your AI-powered project with the community</p>
          </CardContent>
        </Card>
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onView={() => handleView(project)}
            onGenreClick={handleGenreClick}
            onToolClick={handleToolClick}
          />
        ))}
        <LoginDialog 
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          message="Please log in to submit your project"
        />
      </div>
    </div>
  );
}