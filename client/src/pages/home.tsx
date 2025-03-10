import { useQuery } from "@tanstack/react-query";
import { ProjectGrid } from "@/components/project-grid";
import { FilterBar } from "@/components/filter-bar";
import { useState } from "react";
import type { Project } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export default function Home() {
  const [sortBy, setSortBy] = useState("likes");
  const [aiTool, setAiTool] = useState("all");
  const [sponsorshipFilter, setSponsorshipFilter] = useState(false);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { approved: true, sortBy }],
    queryFn: async () => {
      const response = await fetch(`/api/projects?approved=true&sortBy=${sortBy}`);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      console.log("Fetched projects:", data);
      return data;
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

  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black">
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
    </div>
  );
}