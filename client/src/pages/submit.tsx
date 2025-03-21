import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBedrockPassport } from "@bedrock_org/passport";
import {
  insertProjectSchema,
  type InsertProject,
  type Project,
  PREDEFINED_AI_TOOLS,
  PREDEFINED_GENRES,
} from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, useSearch } from "wouter";
import { Helmet } from "react-helmet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";

const defaultFormValues: InsertProject = {
  name: "",
  description: "",
  url: "",
  aiTools: [],
  genres: [],
  thumbnail: "",
  xHandle: "",
  sponsorshipEnabled: false,
  sponsorshipUrl: "",
};

export default function Submit() {
  const { user } = useBedrockPassport();
  const [, setLocation] = useLocation();
  const [searchParams] = useSearch();
  const { toast } = useToast();
  const [newTool, setNewTool] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [projectData, setProjectData] = useState<Project | null>(null);

  // Parse project ID from URL
  const params = new URLSearchParams(searchParams || "");
  const editingProjectId = params.get('edit');
  const projectId = editingProjectId ? parseInt(editingProjectId, 10) : null;
  const isEditing = !!projectId;

  console.log('Submit page - Edit mode:', isEditing, 'Project ID:', projectId);

  // Create form after we have project data
  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      ...defaultFormValues,
      xHandle: '@', // Initialize with @ symbol
    },
  });

  // Fetch project data if editing
  useQuery({
    queryKey: ['/api/projects', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('No project ID provided');

      console.log('Fetching project data for ID:', projectId);
      const response = await fetch(`/api/projects/${projectId}`);

      if (!response.ok) {
        console.error('Failed to fetch project:', await response.text());
        throw new Error('Failed to fetch project');
      }

      const data = await response.json();
      console.log('Successfully fetched project data:', data);
      setProjectData(data);
      return data;
    },
    enabled: isEditing,
  });

  // Update form when project data changes
  useEffect(() => {
    if (projectData) {
      console.log('Updating form with project data:', projectData);
      form.reset({
        name: projectData.name,
        description: projectData.description,
        url: projectData.url,
        aiTools: projectData.aiTools || [],
        genres: projectData.genres || [],
        thumbnail: projectData.thumbnail || '',
        xHandle: projectData.xHandle || '',
        sponsorshipEnabled: projectData.sponsorshipEnabled || false,
        sponsorshipUrl: projectData.sponsorshipUrl || '',
      });
    }
  }, [projectData, form]);

  const { mutate: submitProject, isPending } = useMutation({
    mutationFn: async (data: InsertProject) => {
      const orangeId = user?.id;
      if (!orangeId) throw new Error("User not authenticated");

      let projectData = { ...data };

      // Handle thumbnail upload if needed
      if (data.thumbnailFile instanceof File) {
        const formData = new FormData();
        formData.append("thumbnail", data.thumbnailFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Failed to upload thumbnail");
        const { url } = await uploadRes.json();
        projectData.thumbnail = url;
      }

      delete projectData.thumbnailFile;

      const method = isEditing ? "PATCH" : "POST";
      const endpoint = isEditing ? `/api/projects/${projectId}` : "/api/projects";

      console.log(`Submitting project with method ${method} to endpoint ${endpoint}`, projectData);

      const response = await apiRequest(method, endpoint, {
        ...projectData,
        orangeId,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isEditing ? 'update' : 'submit'} project`);
      }
      return response.json();
    },
    onSuccess: () => {
      setShowSuccessModal(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit project",
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
    form.setValue(
      "aiTools",
      currentTools.filter((t) => t !== tool)
    );
  };

  const handleRemoveGenre = (genre: string) => {
    const currentGenres = form.getValues("genres") || [];
    form.setValue(
      "genres",
      currentGenres.filter((g) => g !== genre)
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'tool' | 'genre') => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (type === 'tool') {
        handleAddTool(newTool);
      } else {
        handleAddGenre(newGenre);
      }
    }
  };

  const handleSubmitAnother = () => {
    setShowSuccessModal(false);
    form.reset(defaultFormValues);
    if (isEditing) {
      setLocation("/submit");
    }
    window.scrollTo(0, 0);
  };

  const handleGoToExplore = () => {
    setShowSuccessModal(false);
    setLocation("/");
  };

  if (!projectData && isEditing) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-800 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-zinc-800 rounded"></div>
            <div className="h-32 bg-zinc-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isEditing ? 'Edit Project' : 'Submit a Project'} - VibeCodingList</title>
        <meta
          name="description"
          content={isEditing ? 'Edit your AI-powered coding project' : 'Share your AI-powered coding project with the community'}
        />
        
        {/* OpenGraph Meta Tags */}
        <meta property="og:title" content={isEditing ? 'Edit Project - VibeCodingList' : 'Submit a Project - VibeCodingList'} />
        <meta property="og:description" content={isEditing ? 'Edit your AI-powered coding project' : 'Share your AI-powered coding project with the community'} />
        <meta property="og:image" content={`${window.location.origin}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="VibeCodingList" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@vibecodinglist" />
        <meta name="twitter:title" content={isEditing ? 'Edit Project - VibeCodingList' : 'Submit a Project - VibeCodingList'} />
        <meta name="twitter:description" content={isEditing ? 'Edit your AI-powered coding project' : 'Share your AI-powered coding project with the community'} />
        <meta name="twitter:image" content={`${window.location.origin}/og-image.png`} />
      </Helmet>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="bg-black border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">
              {isEditing ? 'Edit Project' : 'Submit a Project'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => submitProject(data))}
                className="space-y-6"
              >
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
                      <FormLabel className="text-zinc-400">
                        AI Tools Used
                      </FormLabel>
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
                        <div className="flex gap-2">
                          <Input
                            value={newTool}
                            onChange={(e) => setNewTool(e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, 'tool')}
                            placeholder="Type and press Enter to add custom AI tool"
                            className="bg-zinc-900 border-zinc-700 text-white"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleAddTool(newTool)}
                            className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            Add
                          </Button>
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
                      <FormLabel className="text-zinc-400">
                        Project Genres
                      </FormLabel>
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
                        <div className="flex gap-2">
                          <Input
                            value={newGenre}
                            onChange={(e) => setNewGenre(e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, 'genre')}
                            placeholder="Type and press Enter to add custom genre"
                            className="bg-zinc-900 border-zinc-700 text-white"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleAddGenre(newGenre)}
                            className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="thumbnailFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400">
                        Thumbnail Image
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => field.onChange(e.target.files?.[0])}
                          className="bg-zinc-900 border-zinc-700 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="xHandle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400">
                        X Handle (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value}
                          onChange={(e) => {
                            let value = e.target.value;
                            // Ensure the @ symbol is always present
                            if (!value.startsWith('@')) {
                              value = '@' + value;
                            }
                            field.onChange(value);
                          }}
                          className="bg-zinc-900 border-zinc-700 text-white"
                          placeholder="@username"
                        />
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
                        <FormDescription className="text-sm text-zinc-500">
                          Enable if your project accepts sponsors
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=unchecked]:bg-gray-800 data-[state=unchecked]:border-blue-400 hover:data-[state=unchecked]:border-blue-600"
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
                        <FormLabel className="text-zinc-400">
                          Sponsorship URL
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            className="bg-zinc-900 border-zinc-700 text-white"
                            placeholder="https://..."
                          />
                        </FormControl>
                        <FormDescription className="text-sm text-zinc-500">
                          Link to your sponsorship or pricing page
                          <span className="text-red-400"> *</span>
                        </FormDescription>
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
                  {isEditing ? 'Update Project' : 'Submit Project'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-black border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              Project {isEditing ? 'Updated' : 'Submitted'} Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-zinc-400 mb-6">
              {isEditing
                ? 'Your project has been updated successfully.'
                : 'Your project has been submitted and will be reviewed soon.'}
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleSubmitAnother}
                className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                {isEditing ? 'Edit Another Project' : 'Submit Another Project'}
              </Button>
              <Button
                onClick={handleGoToExplore}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Go to Explore Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}