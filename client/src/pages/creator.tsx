import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { ProjectGrid } from "@/components/project-grid";
import { SiX } from "react-icons/si";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBedrockPassport } from "@bedrock_org/passport";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type CreatorData = {
  projects: Project[];
  stats: {
    totalProjects: number;
    totalLikes: number;
  };
};

export default function CreatorPage() {
  const { handle } = useParams<{ handle: string }>();
  const { toast } = useToast();
  const { isLoggedIn, user } = useBedrockPassport();
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

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

  const startVerification = async () => {
    try {
      setVerifying(true);
      const response = await fetch("/api/verify-x", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xHandle: handle }),
      });

      if (!response.ok) {
        throw new Error("Failed to start verification");
      }

      const data = await response.json();
      setVerificationToken(data.verificationToken);
      setVerifyDialogOpen(true);

      toast({
        title: "Verification Started",
        description: "Please follow the instructions to verify your X account.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start verification",
      });
    } finally {
      setVerifying(false);
    }
  };

  const completeVerification = async () => {
    try {
      setVerifying(true);
      const response = await fetch("/api/verify-x/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xHandle: handle }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete verification");
      }

      const data = await response.json();
      setVerifyDialogOpen(false);
      setVerificationToken(null);

      toast({
        title: "Success",
        description: "Your X account has been verified successfully!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete verification",
      });
    } finally {
      setVerifying(false);
    }
  };

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
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <Card className="bg-black border-zinc-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="flex items-center gap-2">
                <SiX className="h-6 w-6" />
                <span>@{handle}</span>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <div className="text-sm text-zinc-400">
                  <span className="mr-4">{creatorData?.stats.totalProjects} Projects</span>
                  <span>{creatorData?.stats.totalLikes} Likes</span>
                </div>
                {isLoggedIn && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startVerification}
                    disabled={verifying}
                  >
                    Verify X Account
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify X Account</DialogTitle>
              <DialogDescription>
                To verify your X account ownership, please:
                <ol className="list-decimal mt-2 ml-4 space-y-2">
                  <li>Post a tweet with exactly this text: "{verificationToken}"</li>
                  <li>Click the "Complete Verification" button below</li>
                </ol>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={completeVerification} disabled={verifying}>
                Complete Verification
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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