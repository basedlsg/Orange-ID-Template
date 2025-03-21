import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import type { Project } from "@shared/schema";
import { ProjectCard } from "@/components/project-card";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

// Declare the global window interface to include our preloaded project data
declare global {
  interface Window {
    __PRELOADED_PROJECT__?: {
      slug: string;
      id: number;
    };
    __PRELOADED_PROJECT_DATA__?: Project;
  }
}

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const fromCreator = urlParams.get('from') === 'creator';
  const creatorHandle = urlParams.get('handle');
  
  // Get the clean slug without query parameters
  const cleanSlug = slug.split('?')[0];
  
  // Check if we have preloaded project data (from server-side rendering)
  const preloadedProject = window.__PRELOADED_PROJECT__;
  const preloadedProjectData = window.__PRELOADED_PROJECT_DATA__;
  const hasPreloadedData = preloadedProject && preloadedProject.slug === cleanSlug;
  
  // Check if preloaded data is valid for current slug
  const isPreloadedDataValid = preloadedProjectData && preloadedProject?.slug === cleanSlug;

  const { data: project, isLoading, refetch } = useQuery<Project>({
    queryKey: ["/api/projects/by-slug", cleanSlug],
    queryFn: async () => {
      const response = await fetch(`/api/projects/by-slug/${cleanSlug}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      return response.json();
    },
    // Don't auto-fetch if we have preloaded data
    enabled: !hasPreloadedData,
    // Use preloaded data as initial data if available
    initialData: preloadedProjectData && preloadedProject?.slug === cleanSlug 
      ? preloadedProjectData 
      : undefined
  });

  // If we have no project data yet, show loading state
  if (isLoading && !project && !preloadedProjectData) {
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
  
  // Use either the fetched project or preloaded data
  const projectData = project || preloadedProjectData;
  
  // Safety check - if we still have no project data, show error
  if (!projectData) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Project Not Found
          </h1>
          <Button onClick={() => setLocation('/')}>
            Back to Home
          </Button>
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
        <title>{projectData.name} - VibeCodingList</title>
        <meta name="description" content={projectData.description} />
        <link rel="canonical" href={window.location.href} />

        {/* OpenGraph Meta Tags */}
        <meta property="og:title" content={`${projectData.name} - VibeCodingList`} />
        <meta property="og:description" content={projectData.description} />
        <meta property="og:image" content={
          projectData.thumbnail 
            ? projectData.thumbnail.startsWith('http') 
              ? projectData.thumbnail 
              : `${window.location.origin}${projectData.thumbnail}`
            : `${window.location.origin}/default-thumbnail.png`
        } />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="VibeCodingList" />

        {/* Twitter Card Meta Tags */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:site" content="@vibecodinglist" />
        <meta property="twitter:title" content={`${projectData.name} - VibeCodingList`} />
        <meta property="twitter:description" content={projectData.description} />
        <meta property="twitter:image" content={
          projectData.thumbnail 
            ? projectData.thumbnail.startsWith('http') 
              ? projectData.thumbnail 
              : `${window.location.origin}${projectData.thumbnail}`
            : `${window.location.origin}/default-thumbnail.png`
        } />
        <meta property="twitter:creator" content={projectData.xHandle || '@vibecodinglist'} />

        {/* Additional SEO Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content={projectData.xHandle || 'VibeCodingList'} />
        <meta name="keywords" content={`${projectData.genres.join(', ')}, ${projectData.aiTools?.join(', ')}, AI Projects, Coding Projects`} />
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
            project={projectData}
            expanded={true}
          />
        </div>
      </div>
    </div>
  );
}