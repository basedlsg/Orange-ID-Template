import { useQuery, useMutation } from "@tanstack/react-query";
import { ProjectGrid } from "@/components/project-grid";
import { useState } from "react";
import type { Project } from "@shared/schema";
import { useBedrockPassport } from "@bedrock_org/passport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { SiX } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";

export default function Profile() {
  const { isLoggedIn, user } = useBedrockPassport();
  const [activeTab, setActiveTab] = useState("liked");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const orangeId = user?.sub || user?.id;

  // Fetch current user data including X handle
  const { data: userData } = useQuery({
    queryKey: ["/api/users", orangeId],
    queryFn: async () => {
      if (!orangeId) throw new Error("User ID not found");
      const response = await fetch(`/api/users/${orangeId}`);
      if (!response.ok) throw new Error("Failed to fetch user data");
      return response.json();
    },
    enabled: !!orangeId,
  });

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

  // Fetch user's submitted projects
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

  const handleXAuth = async () => {
    // Open X auth in a popup
    const width = 600;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      `/api/auth/twitter?orangeId=${orangeId}`,
      'Twitter Auth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Listen for message from popup
    window.addEventListener('message', (event) => {
      if (event.data.type === 'TWITTER_AUTH_SUCCESS') {
        queryClient.invalidateQueries({ queryKey: ["/api/users", orangeId] });
        toast({
          title: "X Account Verified",
          description: `Successfully verified @${event.data.screen_name}`,
        });
      } else if (event.data.type === 'TWITTER_AUTH_ERROR') {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: "Could not verify your X account. Please try again.",
        });
      }
    }, { once: true });

    // Check if popup was blocked
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      toast({
        variant: "destructive",
        title: "Popup Blocked",
        description: "Please allow popups for X verification.",
      });
    }
  };

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

  return !isLoggedIn ? (
    <Redirect to="/" />
  ) : (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          {!userData?.xHandle && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleXAuth}
              className="flex items-center gap-2 text-zinc-400 hover:text-white"
            >
              <SiX className="h-4 w-4" />
              <span className="text-sm">Verify X Account</span>
            </Button>
          )}
        </div>

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