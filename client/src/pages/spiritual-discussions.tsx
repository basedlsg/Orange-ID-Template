import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useBedrockPassport } from "@bedrock_org/passport";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  MessageCircle, 
  Trash, 
  Edit, 
  Star, 
  Moon, 
  Sun, 
  Calendar,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Create spiritual discussion form schema
const discussionFormSchema = z.object({
  topic: z.string().min(2, {
    message: "Topic must be at least 2 characters"
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters"
  }),
  tags: z.string().optional(),
  kabbalisticElements: z.string().optional(),
  astrologicalContext: z.string().optional(),
});

type DiscussionFormValues = z.infer<typeof discussionFormSchema>;

// Interface for natal chart
interface NatalChart {
  id: number;
  userId: number;
  sunSign?: string;
  moonSign?: string;
  ascendantSign?: string;
  mercurySign?: string;
  venusSign?: string;
  marsSign?: string;
  jupiterSign?: string;
  saturnSign?: string;
  uranusSign?: string;
  neptuneSign?: string;
  plutoSign?: string;
  houses?: string;
  aspects?: string;
  chartData?: string;
  lastUpdated: string;
}

// Interface for discussion from API
interface SpiritualDiscussion {
  id: number;
  userId: number;
  topic: string;
  content: string;
  tags?: string;
  kabbalisticElements?: string;
  astrologicalContext?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function SpiritualDiscussionsPage() {
  const { isLoggedIn, user } = useBedrockPassport();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscussion, setEditingDiscussion] = useState<SpiritualDiscussion | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);

  // Create form with react-hook-form
  const form = useForm<DiscussionFormValues>({
    resolver: zodResolver(discussionFormSchema),
    defaultValues: {
      topic: "",
      content: "",
      tags: "",
      kabbalisticElements: "",
      astrologicalContext: "",
    },
  });

  // Query to fetch natal chart
  const natalChartQuery = useQuery<NatalChart>({
    queryKey: ["/api/natal-chart"],
    enabled: !!isLoggedIn,
  });

  // Query to fetch spiritual discussions
  const discussionsQuery = useQuery<SpiritualDiscussion[]>({
    queryKey: ["/api/spiritual-discussions"],
    enabled: !!isLoggedIn,
  });

  // Reset form when editing a discussion
  useEffect(() => {
    if (editingDiscussion) {
      form.reset({
        topic: editingDiscussion.topic,
        content: editingDiscussion.content,
        tags: editingDiscussion.tags,
        kabbalisticElements: editingDiscussion.kabbalisticElements,
        astrologicalContext: editingDiscussion.astrologicalContext,
      });
    } else {
      form.reset({
        topic: "",
        content: "",
        tags: "",
        kabbalisticElements: "",
        astrologicalContext: "",
      });
    }
  }, [editingDiscussion, form]);

  // Create spiritual discussion mutation
  const createDiscussionMutation = useMutation({
    mutationFn: async (data: DiscussionFormValues) => {
      return apiRequest("/api/spiritual-discussions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Discussion created!",
        description: "Your spiritual discussion has been created successfully.",
      });
      // Close the dialog and invalidate the query
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/spiritual-discussions"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error creating discussion",
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  // Update spiritual discussion mutation
  const updateDiscussionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: DiscussionFormValues }) => {
      return apiRequest(`/api/spiritual-discussions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Discussion updated!",
        description: "Your spiritual discussion has been updated successfully.",
      });
      // Close the dialog, reset editing state, and invalidate the query
      setIsDialogOpen(false);
      setEditingDiscussion(null);
      queryClient.invalidateQueries({ queryKey: ["/api/spiritual-discussions"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error updating discussion",
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  // Delete spiritual discussion mutation
  const deleteDiscussionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/spiritual-discussions/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Discussion deleted",
        description: "Your spiritual discussion has been deleted.",
      });
      // Reset delete dialog state and invalidate the query
      setDeleteDialogOpen(null);
      queryClient.invalidateQueries({ queryKey: ["/api/spiritual-discussions"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error deleting discussion",
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  // Submit form handler
  const onSubmit = async (data: DiscussionFormValues) => {
    try {
      if (editingDiscussion) {
        await updateDiscussionMutation.mutateAsync({ id: editingDiscussion.id, data });
      } else {
        await createDiscussionMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Error submitting discussion:", error);
    }
  };

  // Handle editing a discussion
  const handleEditDiscussion = (discussion: SpiritualDiscussion) => {
    setEditingDiscussion(discussion);
    setIsDialogOpen(true);
  };

  // Handle deleting a discussion
  const handleDeleteDiscussion = async (id: number) => {
    try {
      await deleteDiscussionMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting discussion:", error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Parse tags string into array
  const parseTags = (tagsString?: string) => {
    if (!tagsString) return [];
    try {
      return JSON.parse(tagsString);
    } catch {
      return tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
    }
  };

  // Check if the user has natal chart data
  const hasNatalChart = !!natalChartQuery.data;

  // Show loading state
  if (discussionsQuery.isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card className="bg-black border border-gray-800">
          <CardHeader>
            <CardTitle className="text-[#F37920]">Spiritual Discussions</CardTitle>
            <CardDescription>Loading your spiritual discussions...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-[#F37920] animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get discussions from query
  const discussions = discussionsQuery.data || [];

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="bg-black border border-gray-800 text-white mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-[#F37920] text-2xl">Spiritual Discussions</CardTitle>
              <CardDescription>
                Explore astrological and Kabbalistic insights based on cosmic alignments
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#F37920] hover:bg-[#D86A10]"
                  onClick={() => setEditingDiscussion(null)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Discussion
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black border border-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle className="text-[#F37920]">
                    {editingDiscussion ? "Edit Discussion" : "Create New Discussion"}
                  </DialogTitle>
                  <DialogDescription>
                    Share your thoughts on spiritual and astrological topics
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter a topic for your discussion" 
                              {...field}
                              className="bg-gray-900 border-gray-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Share your thoughts, questions, or insights..." 
                              {...field}
                              className="bg-gray-900 border-gray-700 min-h-[150px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Tabs defaultValue="tags">
                      <TabsList className="bg-gray-900">
                        <TabsTrigger value="tags">Tags</TabsTrigger>
                        <TabsTrigger value="kabbalah">Kabbalah</TabsTrigger>
                        <TabsTrigger value="astrology">Astrology</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="tags">
                        <FormField
                          control={form.control}
                          name="tags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tags</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter tags separated by commas" 
                                  {...field}
                                  className="bg-gray-900 border-gray-700"
                                />
                              </FormControl>
                              <FormDescription>
                                Example: spirituality, stars, meditation
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      
                      <TabsContent value="kabbalah">
                        <FormField
                          control={form.control}
                          name="kabbalisticElements"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kabbalistic Elements</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter any Kabbalistic elements relevant to this discussion..." 
                                  {...field}
                                  value={field.value || ""}
                                  className="bg-gray-900 border-gray-700 min-h-[100px]"
                                />
                              </FormControl>
                              <FormDescription>
                                Tree of Life positions, Hebrew letters, Sephirot, etc.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      
                      <TabsContent value="astrology">
                        <FormField
                          control={form.control}
                          name="astrologicalContext"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Astrological Context</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter any astrological elements relevant to this discussion..." 
                                  {...field}
                                  value={field.value || ""}
                                  className="bg-gray-900 border-gray-700 min-h-[100px]"
                                />
                              </FormControl>
                              <FormDescription>
                                Planetary positions, aspects, transits, etc.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>

                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createDiscussionMutation.isPending || updateDiscussionMutation.isPending}
                        className="bg-[#F37920] hover:bg-[#D86A10]"
                      >
                        {createDiscussionMutation.isPending || updateDiscussionMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {editingDiscussion ? "Updating..." : "Creating..."}
                          </>
                        ) : (
                          editingDiscussion ? "Update Discussion" : "Create Discussion"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!hasNatalChart && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <Calendar className="h-5 w-5 text-[#F37920]" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Complete Your Astrological Profile</h3>
                  <p className="text-sm text-gray-400 mb-2">
                    Enter your birth information to generate your natal chart and receive personalized spiritual insights.
                  </p>
                  <Button 
                    variant="link" 
                    onClick={() => setLocation("/birth-data")}
                    className="text-[#F37920] p-0 h-auto"
                  >
                    Enter Birth Data
                  </Button>
                </div>
              </div>
            </div>
          )}

          {discussions.length === 0 ? (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
              <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No discussions yet</h3>
              <p className="text-gray-400 mb-4">
                Start a new spiritual or astrological discussion to explore the cosmic influences in your life.
              </p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#F37920] hover:bg-[#D86A10]"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New Discussion
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {discussions.map((discussion: SpiritualDiscussion) => (
                <div 
                  key={discussion.id} 
                  className="bg-gray-900 rounded-lg border border-gray-800 p-6"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-medium">{discussion.topic}</h3>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditDiscussion(discussion)}
                        className="h-8 w-8 text-gray-400 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog 
                        open={deleteDialogOpen === discussion.id}
                        onOpenChange={(open) => setDeleteDialogOpen(open ? discussion.id : null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-500"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-black border border-gray-800 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this spiritual discussion and cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-800 hover:bg-gray-700 text-white">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteDiscussion(discussion.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              {deleteDiscussionMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Delete"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-4 whitespace-pre-line">{discussion.content}</p>
                  
                  {/* Tags */}
                  {discussion.tags && (
                    <div className="mb-4">
                      {parseTags(discussion.tags).map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Kabbalistic Elements */}
                  {discussion.kabbalisticElements && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-[#F37920] mb-1 flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        Kabbalistic Elements
                      </h4>
                      <p className="text-sm text-gray-400">{discussion.kabbalisticElements}</p>
                    </div>
                  )}
                  
                  {/* Astrological Context */}
                  {discussion.astrologicalContext && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-[#F37920] mb-1 flex items-center">
                        <Sun className="h-3 w-3 mr-1" />
                        <Moon className="h-3 w-3 mr-1" />
                        Astrological Context
                      </h4>
                      <p className="text-sm text-gray-400">{discussion.astrologicalContext}</p>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Created: {formatDate(discussion.createdAt)}
                    {discussion.updatedAt && discussion.updatedAt !== discussion.createdAt && (
                      <span> · Updated: {formatDate(discussion.updatedAt)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <Separator className="mb-4" />
          <p className="text-sm text-gray-400">
            Spiritual discussions connect your personal astrological profile with Kabbalistic wisdom and
            cosmic alignments, offering deeper insights into your spiritual journey.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}