import { ProjectCard } from "./project-card";
import type { Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useBedrockPassport } from "@bedrock_org/passport";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { LoginDialog } from "./login-dialog";
import { Badge } from "@/components/ui/badge";
import { PREDEFINED_GENRES } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { SkeletonCard } from "./skeleton-card";
import { EditProjectDialog } from "./edit-project-dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectGridProps {
  projects: Project[];
  onProjectView?: (id: number) => void;
  showEditButton?: boolean;
  showSubmitCard?: boolean;
  isLoading?: boolean;
}

export function ProjectGrid({
  projects,
  onProjectView,
  showEditButton = false,
  showSubmitCard = true,
  isLoading = false,
}: ProjectGridProps) {
  const { toast } = useToast();
  const { isLoggedIn, user } = useBedrockPassport();
  const [, setLocation] = useLocation();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const { data: userLikes = [] } = useQuery({
    queryKey: ["/api/users", user?.id, "likes"],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/likes`);
      if (!response.ok) throw new Error("Failed to fetch likes");
      return response.json();
    },
    enabled: isLoggedIn,
    staleTime: 30000,
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
    setProjectToEdit(project);
  };

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      const response = await apiRequest(
        "DELETE",
        `/api/projects/${projectToDelete.id}`,
      );
      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/users", user?.id, "submissions"],
      });

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      setProjectToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const handleLikeClick = async (project: Project) => {
    if (!isLoggedIn) {
      setShowLoginDialog(true);
      return;
    }

    try {
      await apiRequest("POST", `/api/projects/${project.id}/like`);
      toast({
        title: "Success",
        description: "Project liked successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like project",
        variant: "destructive",
      });
    }
  };

  const filteredProjects = selectedGenre
    ? projects.filter((project) => project.genres?.includes(selectedGenre))
    : projects;

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-16 bg-zinc-800 rounded animate-pulse" />
            <div className="h-6 w-20 bg-zinc-800 rounded animate-pulse" />
            <div className="h-6 w-24 bg-zinc-800 rounded animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Genre filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Badge
            key="all"
            variant="secondary"
            className={`cursor-pointer ${!selectedGenre ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-400"}`}
            onClick={() => setSelectedGenre(null)}
          >
            All
          </Badge>
          {PREDEFINED_GENRES.map((genre) => (
            <Badge
              key={genre}
              variant="secondary"
              className={`cursor-pointer ${selectedGenre === genre ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-400"}`}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 h-full">
        {showSubmitCard && (
          <Card
            key="submit-card"
            className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg bg-black border-zinc-800 border-dashed h-full"
            onClick={handleSubmitClick}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="rounded-full bg-blue-500/10 p-4 mb-4">
                <Plus className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">
                Submit Project
              </h3>
              <p className="text-sm text-zinc-400">
                Share your AI-powered project with the community
              </p>
            </CardContent>
          </Card>
        )}

        {filteredProjects.map((project) => (
          <div key={project.id} className="relative h-full">
            <ProjectCard
              project={project}
              onView={() => handleView(project)}
              userLikes={userLikes}
              onLike={() => handleLikeClick(project)}
            />
            {showEditButton && (
              <div className="absolute top-4 right-4 flex gap-2 z-20">
                <Button
                  onClick={() => handleEditClick(project)}
                  variant="outline"
                  size="icon"
                  className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteClick(project)}
                  className="z-20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        message="Please log in to continue"
      />

      <EditProjectDialog
        project={projectToEdit}
        open={!!projectToEdit}
        onOpenChange={(open) => !open && setProjectToEdit(null)}
      />

      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={() => setProjectToDelete(null)}
      >
        <AlertDialogContent className="bg-black border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{projectToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setProjectToDelete(null)}
              className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}