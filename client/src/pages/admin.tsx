import { useQuery, useMutation } from "@tanstack/react-query";
import { ProjectCard } from "@/components/project-card";
import type { Project } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Admin() {
  const { toast } = useToast();

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { approved: false }],
  });

  const { mutate: approveProject } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/projects/${id}/approve`);
    },
    onSuccess: () => {
      // Invalidate both approved and unapproved project queries
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project approved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve project",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <h2 className="mb-8 text-2xl font-bold text-white">Pending Approvals</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <div key={project.id} className="relative">
              <ProjectCard project={project} />
              <div className="absolute bottom-4 right-4">
                <Button 
                  onClick={() => approveProject(project.id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}