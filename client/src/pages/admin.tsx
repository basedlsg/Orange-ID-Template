import { useQuery, useMutation } from "@tanstack/react-query";
import { ProjectCard } from "@/components/project-card";
import type { Project, AdvertisingRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, Check, Edit } from "lucide-react";
import { useBedrockPassport } from "@bedrock_org/passport";
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
import { SkeletonCard } from "@/components/skeleton-card";
import { useLocation } from "wouter";
import { EditProjectDialog } from "@/components/edit-project-dialog";

export default function Admin() {
  const { toast } = useToast();
  const { user } = useBedrockPassport();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [, setLocation] = useLocation();

  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ["/api/users/check-admin", user?.sub || user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/users/check-admin?orangeId=${user?.sub || user?.id}`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.isAdmin;
    },
    enabled: !!user,
  });

  const { data: advertisingRequests, isLoading: isLoadingAds } = useQuery<AdvertisingRequest[]>({
    queryKey: ["/api/advertising-requests"],
    queryFn: async () => {
      const response = await fetch(`/api/advertising-requests?orangeId=${user?.sub || user?.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch advertising requests");
      }
      return response.json();
    },
    enabled: !!isAdmin && !!user,
  });

  const { mutate: markProcessed } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/advertising-requests/${id}/process?orangeId=${user?.sub || user?.id}`);
      if (!response.ok) {
        throw new Error("Failed to mark request as processed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising-requests"] });
      toast({
        title: "Success",
        description: "Advertising request marked as processed",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process request",
      });
    },
  });

  const { data: pendingProjects, isLoading: isPendingLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { approved: false }],
    queryFn: async () => {
      const response = await fetch("/api/projects?approved=false");
      if (!response.ok) {
        throw new Error("Failed to fetch pending projects");
      }
      return response.json();
    },
    enabled: !!isAdmin,
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
    enabled: !!isAdmin,
  });

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

  const { mutate: uploadCsv, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csv', file);

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

  const handleEditClick = (project: Project) => {
    setProjectToEdit(project);
  };

  if (!isAdmin && !isCheckingAdmin) {
    return null;
  }

  if (isPendingLoading || isApprovedLoading || isCheckingAdmin || isLoadingAds) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </div>
      </div>
    );
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

        <div className="mb-12">
          <h3 className="mb-4 text-xl font-semibold text-white">Advertising Requests</h3>
          <div className="bg-zinc-900 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Budget</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {advertisingRequests?.map((request) => (
                    <tr key={request.id} className="text-zinc-300">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{request.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a href={`mailto:${request.email}`} className="text-blue-400 hover:text-blue-300">
                          {request.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{request.company}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{request.budget}</td>
                      <td className="px-6 py-4 text-sm max-w-xs">
                        <div className="truncate" title={request.message}>
                          {request.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          request.processed
                            ? 'bg-green-900 text-green-200'
                            : 'bg-yellow-900 text-yellow-200'
                        }`}>
                          {request.processed ? 'Processed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!request.processed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markProcessed(request.id)}
                            className="text-green-400 hover:text-green-300"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Mark Processed
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!advertisingRequests || advertisingRequests.length === 0) && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-zinc-400">
                        No advertising requests yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="mb-4 text-xl font-semibold text-white">Pending Approvals</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pendingProjects?.map((project) => (
              <div key={project.id} className="relative">
                <ProjectCard project={project} />
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                  <Button
                    onClick={() => handleEditClick(project)}
                    variant="outline"
                    size="icon"
                    className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
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

        <div>
          <h3 className="mb-4 text-xl font-semibold text-white">Approved Projects</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {approvedProjects?.map((project) => (
              <div key={project.id} className="relative">
                <ProjectCard project={project} />
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                  <Button
                    onClick={() => handleEditClick(project)}
                    variant="outline"
                    size="icon"
                    className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
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

        <EditProjectDialog
          project={projectToEdit}
          open={!!projectToEdit}
          onOpenChange={(open) => !open && setProjectToEdit(null)}
        />
      </div>
    </div>
  );
}