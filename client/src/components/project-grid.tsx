import { ProjectCard } from "./project-card";
import type { Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProjectGridProps {
  projects: Project[];
  onProjectView?: (id: number) => void;
}

export function ProjectGrid({ projects, onProjectView }: ProjectGridProps) {
  const { toast } = useToast();

  const handleView = async (project: Project) => {
    try {
      await apiRequest("POST", `/api/projects/${project.id}/view`);
      if (onProjectView) {
        onProjectView(project.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record view",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onView={() => handleView(project)}
        />
      ))}
    </div>
  );
}
