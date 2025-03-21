import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { ProjectGrid } from "@/components/project-grid";
import { SiX } from "react-icons/si";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@shared/schema";

type CreatorData = {
  projects: Project[];
  stats: {
    totalProjects: number;
    totalLikes: number;
  };
};

export default function CreatorPage() {
  const { handle } = useParams<{ handle: string }>();

  const { data: creatorData, isLoading } = useQuery<CreatorData>({
    queryKey: ["/api/creators", handle],
    queryFn: async () => {
      const response = await fetch(`/api/creators/${handle}`);
      if (!response.ok) {
        throw new Error("Failed to fetch creator's projects");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-zinc-800 rounded" />
          <div className="h-[400px] bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  // Sort projects by likes in descending order
  const sortedProjects = creatorData?.projects.sort((a, b) =>
    (b.likeCount || 0) - (a.likeCount || 0)
  );

  // Modify each project's slug to include the creator context
  const projectsWithContext = sortedProjects?.map(project => ({
    ...project,
    slug: `${project.slug}?from=creator&handle=${handle}`
  }));

  return (
    <div className="min-h-screen bg-black">
      <Helmet>
        <title>Projects by @{handle} - VibeCodingList</title>
        <meta
          name="description"
          content={`Discover AI-powered projects created by @${handle}`}
        />
        
        {/* OpenGraph Meta Tags */}
        <meta property="og:title" content={`Projects by @${handle} - VibeCodingList`} />
        <meta property="og:description" content={`Discover AI-powered projects created by @${handle}`} />
        <meta property="og:image" content={`${window.location.origin}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="profile" />
        <meta property="og:site_name" content="VibeCodingList" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@vibecodinglist" />
        <meta name="twitter:title" content={`Projects by @${handle} - VibeCodingList`} />
        <meta name="twitter:description" content={`Discover AI-powered projects created by @${handle}`} />
        <meta name="twitter:image" content={`${window.location.origin}/og-image.png`} />
        <meta name="twitter:creator" content={`@${handle}`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <Card className="bg-black border-zinc-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="flex items-center gap-2">
                <SiX className="h-6 w-6" />
                <span>@{handle}</span>
              </div>
              <div className="ml-auto flex gap-4 text-sm text-zinc-400">
                <span>{creatorData?.stats.totalProjects} Projects</span>
                <span>{creatorData?.stats.totalLikes} Likes</span>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        <h2 className="text-2xl font-bold mb-6 text-white">Projects</h2>
        {projectsWithContext && projectsWithContext.length > 0 ? (
          <ProjectGrid
            projects={projectsWithContext}
            showFilters={false}
            showSubmitCard={false}
          />
        ) : (
          <p className="text-zinc-400">No projects found.</p>
        )}
      </div>
    </div>
  );
}