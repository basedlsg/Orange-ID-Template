import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import type { Project } from "@shared/schema";
import { ProjectCard } from "@/components/project-card";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const fromCreator = urlParams.get('from') === 'creator';
  const creatorHandle = urlParams.get('handle');

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects/by-slug", slug.split('?')[0]], // Remove query params from slug
    queryFn: async () => {
      const response = await fetch(`/api/projects/by-slug/${slug.split('?')[0]}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      return response.json();
    },
  });

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

  const handleBack = () => {
    if (fromCreator && creatorHandle) {
      setLocation(`/creator/${creatorHandle}`);
    } else {
      setLocation('/');
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Helmet>
        <title>{project.name} - VibeCodingList</title>
        <meta name="description" content={project.description} />
        <link rel="canonical" href={window.location.href} />

        {/* OpenGraph Meta Tags */}
        <meta property="og:title" content={`${project.name} - VibeCodingList`} />
        <meta property="og:description" content={project.description} />
        <meta property="og:image" content={project.thumbnail || `${window.location.origin}/default-thumbnail.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="VibeCodingList" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@vibecodinglist" />
        <meta name="twitter:title" content={`${project.name} - VibeCodingList`} />
        <meta name="twitter:description" content={project.description} />
        <meta name="twitter:image" content={project.thumbnail || `${window.location.origin}/twitter-card.png`} />
        <meta name="twitter:image:alt" content={`${project.name} - VibeCodingList`} />
        <meta name="twitter:creator" content={project.xHandle ? `@${project.xHandle.replace('@', '')}` : '@vibecodinglist'} />
        <meta name="twitter:url" content={window.location.href} />

        {/* Additional SEO Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content={project.xHandle || 'VibeCodingList'} />
        <meta name="keywords" content={`${project.genres.join(', ')}, ${project.aiTools?.join(', ')}, AI Projects, Coding Projects`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {fromCreator ? 'Back to Creator Profile' : 'Back to Projects'}
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