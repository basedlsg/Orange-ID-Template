import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye, Sparkles, Heart, Share2 } from "lucide-react";
import { SiX } from "react-icons/si";
import type { Project } from "@shared/schema";
import defaultThumbnail from "../logocode.png";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { useBedrockPassport } from "@bedrock_org/passport";
import { LoginDialog } from "./login-dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ProjectCardProps {
  project: Project;
  onView?: () => void;
  userLikes?: number[];
  onEdit?: () => void;
  expanded?: boolean;
}

export function ProjectCard({
  project,
  onView,
  userLikes = [],
  onEdit,
  expanded = false,
}: ProjectCardProps) {
  const { isLoggedIn, user } = useBedrockPassport();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(false);
  const [, setLocation] = useLocation();

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
        { orangeId },
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
        description:
          error instanceof Error ? error.message : "Failed to update like",
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
    toggleLike();
  };

  const handleClick = async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    if (!expanded) {
      setLocation(`/projects/${project.id}`);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/projects/${project.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Project link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
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

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  const handleVisit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = new URL(project.url);
    url.searchParams.set('utm_source', 'vibecodinglist.com');
    window.open(url.toString(), "_blank");
    if (onView) {
      onView();
    }
  };

  return (
    <>
      <Card
        className={`group cursor-pointer overflow-hidden transition-all hover:shadow-lg bg-black border-zinc-800 h-full flex flex-col ${
          expanded ? 'shadow-lg' : ''
        }`}
        onClick={handleClick}
      >
        <div className={`aspect-video overflow-hidden bg-zinc-900 ${expanded ? 'sm:aspect-[2/1]' : ''}`}>
          <img
            src={project.thumbnail || defaultThumbnail}
            alt={project.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <CardHeader className="p-4">
          <div className="flex items-start justify-between">
            <CardTitle className={`text-white ${expanded ? 'text-2xl' : ''}`}>
              {project.name}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="text-zinc-400 hover:text-white"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`${
                  isLiked ? "text-red-500" : "text-zinc-400 hover:text-red-500"
                } transition-colors`}
                onClick={handleLikeClick}
                disabled={isLiking}
              >
                <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                <span className="ml-1 text-sm">{project.likeCount || 0}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={`p-4 pt-0 flex-grow flex flex-col ${expanded ? 'gap-6' : ''}`}>
          <p className={`mb-4 text-zinc-400 ${expanded ? 'text-lg' : 'text-sm'}`}>
            {project.description}
          </p>
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
          <div className="flex items-center justify-between gap-4 mt-auto">
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
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditClick}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800 z-10"
                >
                  Edit
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVisit}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 z-10"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit
              </Button>
            </div>
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