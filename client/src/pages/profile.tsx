import { useQuery } from "@tanstack/react-query";
import { ProjectGrid } from "@/components/project-grid";
import { useState, Suspense } from "react";
import type { Project } from "@shared/schema";
import { useBedrockPassport } from "@bedrock_org/passport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

function LoadingProjectsGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((n) => (
        <Card key={n} className="bg-black border-zinc-800">
          <div className="aspect-video">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="p-4">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function ProfileContent() {
  const [activeTab, setActiveTab] = useState("liked");
  const { isLoggedIn, user } = useBedrockPassport();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const orangeId = user?.sub || user?.id;

  // Fetch user's liked projects
  const { data: likedProjects } = useQuery<Project[]>({
    queryKey: ["/api/users", orangeId, "likes"],
    queryFn: async () => {
      if (!orangeId) throw new Error("User ID not found");

      // First get the list of liked project IDs
      const likedIdsResponse = await fetch(`/api/users/${orangeId}/likes`);
      if (!likedIdsResponse.ok) throw new Error("Failed to fetch liked projects");
      const likedIds = await likedIdsResponse.json();

      // Then fetch all approved projects and filter by liked IDs
      const projectsResponse = await fetch("/api/projects?approved=true");
      if (!projectsResponse.ok) throw new Error("Failed to fetch projects");
      const allProjects = await projectsResponse.json();

      return allProjects.filter((project: Project) => likedIds.includes(project.id));
    },
    enabled: !!orangeId,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true
  });

  // Fetch user's submitted projects
  const { data: submittedProjects } = useQuery<Project[]>({
    queryKey: ["/api/users", orangeId, "submitted"],
    queryFn: async () => {
      if (!orangeId) throw new Error("User ID not found");
      const response = await fetch(`/api/projects?userId=${orangeId}`);
      if (!response.ok) throw new Error("Failed to fetch submitted projects");
      return response.json();
    },
    enabled: !!orangeId,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true
  });

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-8">
            <TabsTrigger value="liked">Liked Projects</TabsTrigger>
            <TabsTrigger value="submitted">My Submissions</TabsTrigger>
          </TabsList>
          <TabsContent value="liked">
            <ProjectGrid
              projects={likedProjects || []}
              showEditButton={false}
              showSubmitCard={false}
            />
          </TabsContent>
          <TabsContent value="submitted">
            <ProjectGrid
              projects={submittedProjects || []}
              showEditButton={true}
              showSubmitCard={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Profile() {
  const { isLoggedIn } = useBedrockPassport();

  if (!isLoggedIn) {
    return <Redirect to="/" />;
  }

  return (
    <Suspense fallback={<LoadingProjectsGrid />}>
      <ProfileContent />
    </Suspense>
  );
}