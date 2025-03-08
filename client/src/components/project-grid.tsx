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
import { PREDEFINED_GENRES } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";


interface ProjectGridProps {
  projects: Project[];
  onProjectView?: (id: number) => void;
  showEditButton?: boolean;
}

export function ProjectGrid({ projects, onProjectView, showEditButton = false }: ProjectGridProps) {
  const { toast } = useToast();
  const { isLoggedIn, user } = useBedrockPassport();
  const [, setLocation] = useLocation();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Query for user's liked projects
  const { data: userLikes = [] } = useQuery({
    queryKey: ["/api/users", user?.sub || user?.id, "likes"],
    queryFn: async () => {
      if (!user?.sub && !user?.id) return [];
      const response = await fetch(`/api/users/${user.sub || user.id}/likes`);
      if (!response.ok) throw new Error("Failed to fetch likes");
      return response.json();
    },
    enabled: isLoggedIn,
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

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

  const handleEditClick = (project: Project) => {
    setLocation(`/submit?edit=${project.id}`);
  };

  const filteredProjects = selectedGenre
    ? projects.filter(project => project.genres?.includes(selectedGenre))
    : projects;

  return (
    <div>
      {/* Genre Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Badge
            key="all"
            variant="secondary"
            className={`cursor-pointer ${!selectedGenre ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
            onClick={() => setSelectedGenre(null)}
          >
            All
          </Badge>
          {PREDEFINED_GENRES.map((genre) => (
            <Badge
              key={genre}
              variant="secondary"
              className={`cursor-pointer ${selectedGenre === genre ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </Badge>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {!showEditButton && (
          <Card 
            key="submit-card"
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
        )}
        {filteredProjects.map((project) => (
          <ProjectCard
            key={`project-${project.id}`}
            project={project}
            onView={() => handleView(project)}
            userLikes={userLikes}
            onEdit={showEditButton ? () => handleEditClick(project) : undefined}
          />
        ))}
        <LoginDialog 
          key="login-dialog"
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          message="Please log in to submit your project"
        />
      </div>
    </div>
  );
}