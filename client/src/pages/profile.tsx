import { useQuery } from "@tanstack/react-query";
import { ProjectGrid } from "@/components/project-grid";
import { useState } from "react";
import type { Project } from "@shared/schema";
import { useBedrockPassport } from "@bedrock_org/passport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { isLoggedIn, user, signOut } = useBedrockPassport();
  const [activeTab, setActiveTab] = useState("liked");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const orangeId = user?.sub || user?.id;

  // Fetch user's liked projects
  const { data: likedProjects, isLoading: isLoadingLiked } = useQuery<Project[]>({
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
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false
  });

  // Fetch user's submitted projects
  const { data: submittedProjects, isLoading: isLoadingSubmitted } = useQuery<Project[]>({
    queryKey: ["/api/users", orangeId, "submitted"],
    queryFn: async () => {
      if (!orangeId) throw new Error("User ID not found");
      const response = await fetch(`/api/projects?userId=${orangeId}`);
      if (!response.ok) throw new Error("Failed to fetch submitted projects");
      return response.json();
    },
    enabled: !!orangeId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false
  });

  if (isLoadingLiked || isLoadingSubmitted) {
    return <div className="text-white">Loading...</div>;
  }

  // Instead of early return, render the redirect inside the main return
  return !isLoggedIn ? (
    <Redirect to="/" />
  ) : (
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