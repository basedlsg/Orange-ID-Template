import { useQuery } from "@tanstack/react-query";
import { ProjectGrid } from "@/components/project-grid";
import { FilterBar } from "@/components/filter-bar";
import { useState } from "react";
import type { Project } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export default function Home() {
  const [sortBy, setSortBy] = useState("newest");

  // Only fetch approved projects for the home page
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects?approved=true", { sortBy }],
  });

  const handleProjectView = (id: number) => {
    queryClient.setQueryData<Project[]>(
      ["/api/projects?approved=true", { sortBy }],
      (old) =>
        old?.map((p) =>
          p.id === id ? { ...p, views: p.views + 1 } : p
        )
    );
  };

  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <FilterBar sortBy={sortBy} onSortChange={setSortBy} />
        <ProjectGrid
          projects={projects || []}
          onProjectView={handleProjectView}
        />
      </div>
    </div>
  );
}