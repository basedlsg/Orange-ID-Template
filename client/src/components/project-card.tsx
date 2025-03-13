import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye, Sparkles, Heart } from "lucide-react";
import { SiX } from "react-icons/si";
import type { Project } from "@shared/schema";
import defaultThumbnail from "../logocode.png";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { useBedrockPassport } from "@bedrock_org/passport";
import { LoginDialog } from "./login-dialog";
import { useToast } from "@/hooks/use-toast";

interface ProjectCardProps {
  project: Project;
  onView?: () => void;
  userLikes?: number[];
  onLike?: () => void;
}

export function ProjectCard({ project, onView, userLikes = [], onLike }: ProjectCardProps) {
  const { isLoggedIn, user } = useBedrockPassport();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    setIsLiked(userLikes.includes(project.id));
  }, [userLikes, project.id]);

  const { mutate: toggleLike, isPending: isLiking } = useMutation({
    mutationFn: async () => {
      if (!user?.sub && !user?.id) {
        throw new Error("User ID not found");
      }

      const orangeId = user.sub || user.id;
      const response = await apiRequest(
        "POST",
        `/api/projects/${project.id}/like`,
        { orangeId }
      );
      if (!response.ok) {
        throw new Error("Failed to toggle like");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      if (user?.sub || user?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/users", user.sub || user.id, "likes"],
          exact: true,
        });
      }
      setIsLiked(!isLiked);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update like",
        variant: "destructive",
      });
    },
  });

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setShowLoginDialog(true);
      return;
    }
    if (onLike) {
      onLike();
    } else {
      toggleLike();
    }
  };

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
    <>
      <Card 
        className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg bg-black border-zinc-800 h-full flex flex-col"
        onClick={handleClick}
      >
        <div className="aspect-video overflow-hidden bg-zinc-900">
          <img
            src={project.thumbnail || defaultThumbnail}
            alt={project.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <CardHeader className="p-4">
          <div className="flex items-start justify-between">
            <CardTitle className="text-white line-clamp-2">{project.name}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className={`${
                isLiked ? 'text-red-500' : 'text-zinc-400 hover:text-red-500'
              } transition-colors`}
              onClick={handleLikeClick}
              disabled={isLiking}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="ml-1 text-sm">{project.likeCount || 0}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex flex-col flex-grow">
          <p className="mb-4 text-sm text-zinc-400 line-clamp-3">{project.description}</p>
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
            {project.genres?.map((genre) => (
              <Badge
                key={genre}
                variant="secondary"
                className="bg-green-500/10 text-green-400"
              >
                {genre}
              </Badge>
            ))}
            {project.aiTools?.map((tool) => (
              <Badge
                key={tool}
                variant="secondary"
                className="bg-blue-500/10 text-blue-400"
              >
                {tool}
              </Badge>
            ))}
          </div>
          <div className="mt-auto flex items-center justify-between gap-4">
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
                  className="text-zinc-400 hover:text-blue-400 p-0 h-auto"
                >
                  <SiX className="h-4 w-4" />
                </Button>
              )}
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
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        message="Please log in to like projects"
      />
    </>
  );
}