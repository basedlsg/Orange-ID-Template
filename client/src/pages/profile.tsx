import { useQuery } from "@tanstack/react-query";
import { ProjectGrid } from "@/components/project-grid";
import { useState } from "react";
import type { Project } from "@shared/schema";
import { useBedrockPassport } from "@bedrock_org/passport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { isLoggedIn, user } = useBedrockPassport();
  const [activeTab, setActiveTab] = useState("liked");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const orangeId = user?.sub || user?.id;

  // Fetch user's liked projects with full data
  const { data: likedProjects, isLoading: isLoadingLiked, isError: isErrorLiked, error: errorLiked } = useQuery<Project[]>({
    queryKey: ["/api/users", orangeId, "liked-projects"],
    queryFn: async () => {
      if (!orangeId) throw new Error("User ID not found");

      // Fetch the complete liked projects data in a single request
      const response = await fetch(`/api/users/${orangeId}/liked-projects`);
      if (!response.ok) throw new Error("Failed to fetch liked projects");
      return response.json();
    },
    enabled: !!orangeId && isLoggedIn,
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false
  });

  // Fetch user's submitted projects
  const { data: submittedProjects, isLoading: isLoadingSubmitted, isError: isErrorSubmitted, error: errorSubmitted } = useQuery<Project[]>({
    queryKey: ["/api/users", orangeId, "submitted"],
    queryFn: async () => {
      if (!orangeId) throw new Error("User ID not found");
      const response = await fetch(`/api/projects?userId=${orangeId}`);
      if (!response.ok) throw new Error("Failed to fetch submitted projects");
      return response.json();
    },
    enabled: !!orangeId && isLoggedIn,
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false
  });

  const isLoading = isLoadingLiked || isLoadingSubmitted;
  const isError = isErrorLiked || isErrorSubmitted;

  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  if (isError) {
    return <div className="text-red-500">Error loading data: {errorLiked?.message || errorSubmitted?.message}</div>;
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