import { useQuery, useMutation } from "@tanstack/react-query";
import { ProjectCard } from "@/components/project-card";
import type { Project } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Admin() {
  const { toast } = useToast();

  // Use explicit queryFn for debugging
  const { data: pendingProjects, isLoading: isPendingLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { approved: false }],
    queryFn: async () => {
      const response = await fetch("/api/projects?approved=false");
      const data = await response.json();
      console.log("Pending projects data:", data); // Debug log
      return data;
    },
  });

  const { data: approvedProjects, isLoading: isApprovedLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { approved: true }],
    queryFn: async () => {
      const response = await fetch("/api/projects?approved=true");
      const data = await response.json();
      console.log("Approved projects data:", data); // Debug log
      return data;
    },
  });

  const { mutate: approveProject } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/projects/${id}/approve`);
    },
    onSuccess: () => {
      // Invalidate both queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ["/api/projects", { approved: false }] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", { approved: true }] });
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

  if (isPendingLoading || isApprovedLoading) {
    return <div className="text-white">Loading...</div>;
  }

  console.log("Rendering with pending projects:", pendingProjects); // Debug log
  console.log("Rendering with approved projects:", approvedProjects); // Debug log

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <h2 className="mb-8 text-2xl font-bold text-white">Admin Dashboard</h2>

        {/* Pending Approvals Section */}
        <div className="mb-12">
          <h3 className="mb-4 text-xl font-semibold text-white">Pending Approvals</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pendingProjects?.map((project) => (
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
            {(!pendingProjects || pendingProjects.length === 0) && (
              <p className="text-zinc-400">No pending projects</p>
            )}
          </div>
        </div>

        {/* Approved Projects Section */}
        <div>
          <h3 className="mb-4 text-xl font-semibold text-white">Approved Projects</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {approvedProjects?.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            {(!approvedProjects || approvedProjects.length === 0) && (
              <p className="text-zinc-400">No approved projects</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}