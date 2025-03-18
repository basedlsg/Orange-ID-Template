import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import type { Project } from "@shared/schema";
import { ProjectCard } from "@/components/project-card";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Share2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects/by-slug", slug],
    queryFn: async () => {
      const response = await fetch(`/api/projects/by-slug/${slug}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      return response.json();
    },
  });

  const handleShare = async () => {
    const url = window.location.href;
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

  if (isLoading || !project) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-zinc-800 rounded mb-4" />
            <div className="h-[400px] bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Helmet>
        <title>{project.name} - VibeCodingList</title>
        <meta name="description" content={project.description} />

        {/* OpenGraph Meta Tags */}
        <meta property="og:title" content={project.name} />
        <meta property="og:description" content={project.description} />
        <meta property="og:image" content={project.thumbnail || '/default-thumbnail.png'} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={project.name} />
        <meta name="twitter:description" content={project.description} />
        <meta name="twitter:image" content={project.thumbnail || '/default-thumbnail.png'} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <Button
            variant="outline"
            className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Project
          </Button>
        </div>

        <div className="max-w-3xl mx-auto">
          <ProjectCard
            project={project}
            expanded={true}
          />
        </div>
      </div>
    </div>
  );
}