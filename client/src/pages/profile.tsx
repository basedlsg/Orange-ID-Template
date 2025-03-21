import { useQuery } from "@tanstack/react-query";
import { ProjectGrid } from "@/components/project-grid";
import { useState } from "react";
import type { Project } from "@shared/schema";
import { useBedrockPassport } from "@bedrock_org/passport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";

export default function Profile() {
  const { isLoggedIn, user } = useBedrockPassport();
  const [activeTab, setActiveTab] = useState("liked");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const orangeId = user?.sub || user?.id;

  // Fetch user's liked projects
  const { data: likedProjects, isLoading: isLoadingLiked } = useQuery<Project[]>({
    queryKey: ["/api/users", orangeId, "liked-projects"],
    queryFn: async () => {
      if (!orangeId) throw new Error("User ID not found");
      const response = await fetch(`/api/users/${orangeId}/liked-projects`);
      if (!response.ok) throw new Error("Failed to fetch liked projects");
      return response.json();
    },
    enabled: !!orangeId,
  });

  // Fetch user's submitted projects using the new endpoint
  const { data: submittedProjects, isLoading: isLoadingSubmitted } = useQuery<Project[]>({
    queryKey: ["/api/users", orangeId, "submissions"],
    queryFn: async () => {
      if (!orangeId) throw new Error("User ID not found");
      const response = await fetch(`/api/users/${orangeId}/submissions`);
      if (!response.ok) throw new Error("Failed to fetch submitted projects");
      return response.json();
    },
    enabled: !!orangeId,
  });

  const handleLogout = async () => {
    try {
      await user?.signOut();
      toast({
        title: "Logged out successfully",
        description: "Come back soon!",
      });
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error logging out",
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  // Instead of early return, render the redirect inside the main return
  return !isLoggedIn ? (
    <Redirect to="/" />
  ) : (
    <div className="min-h-screen bg-black">
      <Helmet>
        <title>Your Profile - VibeCodingList</title>
        <meta
          name="description"
          content="Manage your liked projects and submissions on VibeCodingList"
        />
        <link rel="canonical" href={window.location.href} />
        
        {/* OpenGraph Meta Tags */}
        <meta property="og:title" content="Your Profile - VibeCodingList" />
        <meta property="og:description" content="Manage your liked projects and submissions on VibeCodingList" />
        <meta property="og:image" content={`${window.location.origin}/og-image.png`} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="profile" />
        <meta property="og:site_name" content="VibeCodingList" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@vibecodinglist" />
        <meta name="twitter:creator" content="@vibecodinglist" />
        <meta name="twitter:title" content="Your Profile - VibeCodingList" />
        <meta name="twitter:description" content="Manage your liked projects and submissions on VibeCodingList" />
        <meta name="twitter:image" content={`${window.location.origin}/twitter-card.png`} />
        <meta name="twitter:image:alt" content="Your Profile on VibeCodingList" />
        <meta name="twitter:url" content={window.location.href} />
      </Helmet>
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
              isLoading={isLoadingLiked}
            />
          </TabsContent>
          <TabsContent value="submitted">
            <ProjectGrid
              projects={submittedProjects || []}
              showEditButton={true}
              showSubmitCard={true}
              isLoading={isLoadingSubmitted}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}