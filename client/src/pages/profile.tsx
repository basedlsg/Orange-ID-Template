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
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";

export default function Profile() {
  const { isLoggedIn, user } = useBedrockPassport();
  const [activeTab, setActiveTab] = useState("liked");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [xHandle, setXHandle] = useState("");

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

  // X handle update mutation
  const updateXHandleMutation = useMutation({
    mutationFn: async (handle: string) => {
      const response = await fetch("/api/users/x-handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xHandle: handle, orangeId }),
      });
      if (!response.ok) {
        throw new Error("Failed to update X handle");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "X Handle Updated",
        description: "Your X handle has been successfully verified and saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", orangeId] });
      setXHandle("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update X handle",
      });
    },
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

  const handleXHandleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!xHandle) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your X handle",
      });
      return;
    }
    updateXHandleMutation.mutate(xHandle);
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

  // Instead of early return, render the redirect inside the main return
  return !isLoggedIn ? (
    <Redirect to="/" />
  ) : (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* X Handle Verification Card */}
        <Card className="bg-black border-zinc-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">
              <div className="flex items-center gap-2">
                <SiX className="h-6 w-6" />
                <span>X Account Verification</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userData?.xHandle ? (
              <div className="text-zinc-400">
                Verified X Handle: <span className="text-white">@{userData.xHandle}</span>
              </div>
            ) : (
              <form onSubmit={handleXHandleSubmit} className="flex gap-4">
                <Input
                  type="text"
                  placeholder="Enter your X handle"
                  value={xHandle}
                  onChange={(e) => setXHandle(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
                <Button
                  type="submit"
                  disabled={updateXHandleMutation.isPending}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Verify
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

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