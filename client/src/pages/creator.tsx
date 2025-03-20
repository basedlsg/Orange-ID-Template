import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { ProjectGrid } from "@/components/project-grid";
import { SiX } from "react-icons/si";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@shared/schema";

export default function CreatorPage() {
  const { handle } = useParams<{ handle: string }>();

  const { data: projects, isLoading } = useQuery<Project[]>({
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

  return (
    <div className="min-h-screen bg-black">
      <Helmet>
        <title>Projects by @{handle} - VibeCodingList</title>
        <meta
          name="description"
          content={`Discover AI-powered projects created by @${handle}`}
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <Card className="bg-black border-zinc-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <SiX className="h-6 w-6" />
              <span>@{handle}</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <h2 className="text-2xl font-bold mb-6 text-white">Projects</h2>
        {projects && projects.length > 0 ? (
          <ProjectGrid projects={projects} />
        ) : (
          <p className="text-zinc-400">No projects found.</p>
        )}
      </div>
    </div>
  );
}