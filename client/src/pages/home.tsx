import { useQuery } from "@tanstack/react-query";
import { ProjectGrid } from "@/components/project-grid";
import { FilterBar } from "@/components/filter-bar";
import { ProjectCardSkeleton } from "@/components/project-card-skeleton";
import { useState } from "react";
import type { Project } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export default function Home() {
  const [sortBy, setSortBy] = useState("newest");

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { approved: true }],
    queryFn: async () => {
      const response = await fetch(`/api/projects?approved=true${sortBy ? `&sortBy=${sortBy}` : ''}`);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      return response.json();
    }
  });

  const handleProjectView = (id: number) => {
    queryClient.setQueryData<Project[]>(
      ["/api/projects", { approved: true }],
      (old) =>
        old?.map((p) =>
          p.id === id ? { ...p, views: p.views + 1 } : p
        )
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <FilterBar sortBy={sortBy} onSortChange={setSortBy} />
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <ProjectGrid
            projects={projects || []}
            onProjectView={handleProjectView}
          />
        )}
      </div>
    </div>
  );
}