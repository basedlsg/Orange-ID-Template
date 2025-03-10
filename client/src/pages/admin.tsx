import { useQuery, useMutation } from "@tanstack/react-query";
import { ProjectCard } from "@/components/project-card";
import type { Project } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Upload, Trash2 } from "lucide-react";
import { useBedrockPassport } from "@bedrock_org/passport";
import { Redirect } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function Admin() {
  const { toast } = useToast();
  const { isLoggedIn, user } = useBedrockPassport();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // If not logged in, redirect immediately
  if (!isLoggedIn) {
    return <Redirect to="/" />;
  }

  // Check admin status
  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ["/api/users/check-admin", user?.sub || user?.id],
    queryFn: async () => {
      if (!user?.sub && !user?.id) return false;
      const response = await fetch(`/api/users/check-admin?orangeId=${user.sub || user.id}`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.isAdmin;
    },
    enabled: isLoggedIn,
  });

  // If we've finished checking and user is not admin, redirect
  if (!isCheckingAdmin && !isAdmin) {
    return <Redirect to="/" />;
  }

  const { data: pendingProjects, isLoading: isPendingLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { approved: false }],
    queryFn: async () => {
      const response = await fetch("/api/projects?approved=false");
      if (!response.ok) {
        throw new Error("Failed to fetch pending projects");
      }
      return response.json();
    },
    enabled: isLoggedIn && isAdmin,
  });

  const { data: approvedProjects, isLoading: isApprovedLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { approved: true }],
    queryFn: async () => {
      const response = await fetch("/api/projects?approved=true");
      if (!response.ok) {
        throw new Error("Failed to fetch approved projects");
      }
      return response.json();
    },
    enabled: isLoggedIn && isAdmin,
  });

  const { mutate: uploadCsv, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csv', file);

      // Add orangeId to FormData
      const orangeId = user?.sub || user?.id;
      if (!orangeId) {
        throw new Error("User not authenticated");
      }
      formData.append('orangeId', orangeId);

      const response = await fetch("/api/projects/batch", {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload CSV");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: `Successfully imported ${data.count} projects`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload CSV",
        variant: "destructive",
      });
    },
  });

  // Show loading state while checking admin status
  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 bg-blue-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const { mutate: approveProject } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/projects/${id}/approve`);
      if (!response.ok) {
        throw new Error("Failed to approve project");
      }
      return response.json();
    },
    onSuccess: (approvedProject) => {
      queryClient.setQueryData<Project[]>(
        ["/api/projects", { approved: false }],
        (old) => old?.filter((p) => p.id !== approvedProject.id) || []
      );

      queryClient.setQueryData<Project[]>(
        ["/api/projects", { approved: true }],
        (old) => [approvedProject, ...(old || [])]
      );

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

  const { mutate: deleteProject } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/projects/${id}`);
      if (!response.ok) {
        throw new Error("Failed to delete project");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/csv" || file.name.endsWith('.csv')) {
        uploadCsv(file);
      } else {
        toast({
          title: "Error",
          description: "Please upload a valid CSV file",
          variant: "destructive",
        });
      }
    }
  };

  if (isPendingLoading || isApprovedLoading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
          <div className="relative">
            <Input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload CSV"}
            </Button>
          </div>
        </div>

        {/* Pending Approvals Section */}
        <div className="mb-12">
          <h3 className="mb-4 text-xl font-semibold text-white">Pending Approvals</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pendingProjects?.map((project) => (
              <div key={project.id} className="relative">
                <ProjectCard project={project} />
                <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                  <Button
                    onClick={() => approveProject(project.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white z-20"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setProjectToDelete(project)}
                    className="z-20"
                  >
                    <Trash2 className="h-4 w-4" />
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
              <div key={project.id} className="relative">
                <ProjectCard project={project} />
                <div className="absolute inset-x-0 bottom-4 flex justify-center">
                  <Button
                    variant="destructive"
                    onClick={() => setProjectToDelete(project)}
                    className="z-20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(!approvedProjects || approvedProjects.length === 0) && (
              <p className="text-zinc-400">No approved projects</p>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
          <AlertDialogContent className="bg-black border-zinc-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Project</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setProjectToDelete(null)}
                className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (projectToDelete) {
                    deleteProject(projectToDelete.id);
                    setProjectToDelete(null);
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}