import { useQuery } from "@tanstack/react-query";
import { ProjectGrid } from "@/components/project-grid";
import { useState } from "react";
import type { Project } from "@shared/schema";
import { useBedrockPassport } from "@bedrock_org/passport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect } from "wouter";

export default function Profile() {
  // Always define hooks at the top level
  const { isLoggedIn, user } = useBedrockPassport();
  const [activeTab, setActiveTab] = useState("liked");
  const orangeId = user?.sub || user?.id;

  // Early return if not logged in
  if (!isLoggedIn || !orangeId) {
    return <Redirect to="/" />;
  }

  // Fetch user's liked projects with proper caching
  const { data: likedProjects, isLoading: isLoadingLiked } = useQuery<Project[]>({
    queryKey: ["/api/users", orangeId, "likes"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${orangeId}/likes`);
      if (!response.ok) throw new Error("Failed to fetch liked projects");
      const likes = await response.json();
      return likes.map((like: any) => like.project);
    },
    staleTime: 30000, // Keep the data fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: isLoggedIn && !!orangeId
  });

  // Fetch user's submitted projects
  const { data: submittedProjects, isLoading: isLoadingSubmitted } = useQuery<Project[]>({
    queryKey: ["/api/users", orangeId, "submitted"],
    queryFn: async () => {
      const response = await fetch(`/api/projects?orangeId=${orangeId}`);
      if (!response.ok) throw new Error("Failed to fetch submitted projects");
      return response.json();
    },
    staleTime: 30000,
    cacheTime: 5 * 60 * 1000,
    enabled: isLoggedIn && !!orangeId
  });

  if (isLoadingLiked || isLoadingSubmitted) {
    return <div className="text-white">Loading...</div>;
  }

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
            />
          </TabsContent>
          <TabsContent value="submitted">
            <ProjectGrid
              projects={submittedProjects || []}
              showEditButton={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}