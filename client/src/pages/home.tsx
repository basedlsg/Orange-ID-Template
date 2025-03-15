import { useQuery } from "@tanstack/react-query";
import { ProjectGrid } from "@/components/project-grid";
import { FilterBar } from "@/components/filter-bar";
import { useState } from "react";
import type { Project } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { SiX } from "react-icons/si";

export default function Home() {
  const [sortBy, setSortBy] = useState("likes");
  const [aiTool, setAiTool] = useState("all");
  const [sponsorshipFilter, setSponsorshipFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
      if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !project.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
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
      {/* Social Banner - Commented out, uncomment to re-enable X/Twitter CTA
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
      */}

      <div className="container mx-auto px-4 py-8">
        <FilterBar 
          sortBy={sortBy} 
          aiTool={aiTool}
          sponsorshipFilter={sponsorshipFilter}
          searchQuery={searchQuery}
          onSortChange={setSortBy}
          onAiToolChange={setAiTool}
          onSponsorshipFilterChange={setSponsorshipFilter}
          onSearchChange={setSearchQuery}
        />
        <ProjectGrid
          projects={sortedAndFilteredProjects || []}
          onProjectView={handleProjectView}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}