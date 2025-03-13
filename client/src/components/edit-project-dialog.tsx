import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { PREDEFINED_AI_TOOLS, PREDEFINED_GENRES, type Project, type InsertProject, insertProjectSchema } from "@shared/schema";

interface EditProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
  const { toast } = useToast();
  const [newTool, setNewTool] = useState("");
  const [newGenre, setNewGenre] = useState("");

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: project ? {
      name: project.name,
      description: project.description,
      url: project.url,
      aiTools: project.aiTools || [],
      genres: project.genres || [],
      thumbnail: project.thumbnail || '',
      xHandle: project.xHandle || '',
      sponsorshipEnabled: project.sponsorshipEnabled || false,
      sponsorshipUrl: project.sponsorshipUrl || '',
    } : undefined
  });

  const { mutate: updateProject, isPending } = useMutation({
    mutationFn: async (data: InsertProject) => {
      if (!project) throw new Error("No project to update");

      const response = await apiRequest("PATCH", `/api/projects/${project.id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update project");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive",
      });
    },
  });

  const handleAddTool = (tool: string) => {
    if (!tool.trim()) return;
    const currentTools = form.getValues("aiTools") || [];
    if (!currentTools.includes(tool)) {
      form.setValue("aiTools", [...currentTools, tool]);
    }
    setNewTool("");
  };

  const handleAddGenre = (genre: string) => {
    if (!genre.trim()) return;
    const currentGenres = form.getValues("genres") || [];
    if (!currentGenres.includes(genre)) {
      form.setValue("genres", [...currentGenres, genre]);
    }
    setNewGenre("");
  };

  const handleRemoveTool = (tool: string) => {
    const currentTools = form.getValues("aiTools") || [];
    form.setValue("aiTools", currentTools.filter((t) => t !== tool));
  };

  const handleRemoveGenre = (genre: string) => {
    const currentGenres = form.getValues("genres") || [];
    form.setValue("genres", currentGenres.filter((g) => g !== genre));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-zinc-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => updateProject(data))} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Project Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-zinc-900 border-zinc-700 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="bg-zinc-900 border-zinc-700 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Project URL</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" className="bg-zinc-900 border-zinc-700 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aiTools"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">AI Tools Used</FormLabel>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 bg-zinc-900 border border-zinc-700 rounded-md">
                      {field.value?.map((tool) => (
                        <Badge
                          key={tool}
                          variant="secondary"
                          className="bg-blue-500/10 text-blue-400 flex items-center gap-1"
                        >
                          {tool}
                          <button
                            type="button"
                            onClick={() => handleRemoveTool(tool)}
                            className="hover:text-blue-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {PREDEFINED_AI_TOOLS.map((tool) => (
                        <Button
                          key={tool}
                          type="button"
                          variant="outline"
                          onClick={() => handleAddTool(tool)}
                          className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                          {tool}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="genres"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Project Genres</FormLabel>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 bg-zinc-900 border border-zinc-700 rounded-md">
                      {field.value?.map((genre) => (
                        <Badge
                          key={genre}
                          variant="secondary"
                          className="bg-green-500/10 text-green-400 flex items-center gap-1"
                        >
                          {genre}
                          <button
                            type="button"
                            onClick={() => handleRemoveGenre(genre)}
                            className="hover:text-green-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {PREDEFINED_GENRES.map((genre) => (
                        <Button
                          key={genre}
                          type="button"
                          variant="outline"
                          onClick={() => handleAddGenre(genre)}
                          className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                          {genre}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="xHandle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">X Handle (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-zinc-900 border-zinc-700 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sponsorshipEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-zinc-400">
                      Open for Sponsorship
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=unchecked]:bg-gray-800 data-[state=unchecked]:border-blue-400"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("sponsorshipEnabled") && (
              <FormField
                control={form.control}
                name="sponsorshipUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-400">Sponsorship URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        className="bg-zinc-900 border-zinc-700 text-white"
                        placeholder="https://..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isPending ? "Updating..." : "Update Project"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}