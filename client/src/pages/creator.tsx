import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Helmet } from "react-helmet";
import { ProjectGrid } from "@/components/project-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiX } from "react-icons/si";

export default function CreatorProfile() {
  const { handle } = useParams<{ handle: string }>();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/projects", { xHandle: handle }],
    queryFn: async () => {
      const response = await fetch(`/api/projects?xHandle=${handle}`);
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
        <title>@{handle} - Creator Profile - VibeCodingList</title>
        <meta
          name="description"
          content={`Check out ${handle}'s AI-powered projects on VibeCodingList`}
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8 bg-black border-zinc-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <SiX className="h-6 w-6" />
              <a
                href={`https://x.com/${handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400"
              >
                @{handle}
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-zinc-400">
              <p>Total Projects: {projects?.length || 0}</p>
              <p>Total Likes: {projects?.reduce((sum, p) => sum + (p.likeCount || 0), 0)}</p>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold mb-6 text-white">Projects</h2>
        <ProjectGrid projects={projects || []} />
      </div>
    </div>
  );
}
