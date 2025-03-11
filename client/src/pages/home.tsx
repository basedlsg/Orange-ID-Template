import { useQuery } from "@tanstack/react-query";
import { ProjectGrid } from "@/components/project-grid";
import { FilterBar } from "@/components/filter-bar";
import { useState } from "react";
import type { Project } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { SiX } from "react-icons/si";
import { useBedrockPassport } from "@bedrock_org/passport";
import { LoginDialog } from "@/components/login-dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function Home() {
  const [sortBy, setSortBy] = useState("likes");
  const [aiTool, setAiTool] = useState("all");
  const [sponsorshipFilter, setSponsorshipFilter] = useState(false);
  const { isLoggedIn } = useBedrockPassport();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { approved: true, sortBy }],
    queryFn: async () => {
      const response = await fetch(`/api/projects?approved=true&sortBy=${sortBy}`);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      return response.json();
    }
  });

  const handleProjectView = (id: number) => {
    queryClient.setQueryData<Project[]>(
      ["/api/projects", { approved: true, sortBy }],
      (old) =>
        old?.map((p) =>
          p.id === id ? { ...p, views: p.views + 1 } : p
        )
    );
  };

  const sortedAndFilteredProjects = projects
    ?.filter((project) => {
      if (sponsorshipFilter && !project.sponsorshipEnabled) return false;
      if (aiTool !== "all" && !project.aiTools?.includes(aiTool)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "likes") return (b.likeCount || 0) - (a.likeCount || 0);
      if (sortBy === "views") return b.views - a.views;
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  return (
    <div className="min-h-screen bg-black">
      {/* Login Benefits Banner */}
      {!isLoggedIn && (
        <div className="bg-gradient-to-r from-blue-600/20 via-blue-600/10 to-blue-600/5 border-b border-blue-500/20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-zinc-200">
                  Join the community to like projects, track your favorites, and unlock exclusive features!
                </span>
              </div>
              <Button
                onClick={() => setShowLoginDialog(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
                size="sm"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Social Banner */}
      <div className="border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-black">
        <div className="container mx-auto px-4 py-3">
          <a 
            href="https://x.com/vibecodinglist" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center sm:justify-start gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <SiX className="h-4 w-4" />
            <span className="text-sm">
              Follow <span className="font-medium text-blue-400">@vibecodinglist</span> for weekly updates on the latest AI-powered projects
            </span>
          </a>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <FilterBar 
          sortBy={sortBy} 
          aiTool={aiTool}
          sponsorshipFilter={sponsorshipFilter}
          onSortChange={setSortBy}
          onAiToolChange={setAiTool}
          onSponsorshipFilterChange={setSponsorshipFilter}
        />
        <ProjectGrid
          projects={sortedAndFilteredProjects || []}
          onProjectView={handleProjectView}
          isLoading={isLoading}
        />
      </div>

      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog}
        message="Join the community to like projects and unlock exclusive features!"
      />
    </div>
  );
}