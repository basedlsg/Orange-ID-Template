import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useBedrockPassport } from "@bedrock_org/passport";
import { LoginDialog } from "./login-dialog";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Bug, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Feedback } from "@shared/schema";

interface FeedbackListProps {
  projectId: number;
}

export function FeedbackList({ projectId }: FeedbackListProps) {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { isLoggedIn, user } = useBedrockPassport();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get project feedback with better caching
  const { data: feedbacks = [], isLoading } = useQuery<Feedback[]>({
    // Use a consistent query key format that matches what's used in project-card.tsx
    queryKey: [`/api/projects/${projectId}/feedback`],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }
      return response.json();
    },
    // Conservative caching configuration
    staleTime: 300000, // 5 minutes
    gcTime: 600000,    // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: []
  });

  // Get user's voted feedback IDs
  const { data: userVotes = [] } = useQuery<number[]>({
    queryKey: ["/api/users", user?.id, "feedback-votes"],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/feedback-votes`);
      if (!response.ok) {
        throw new Error("Failed to fetch votes");
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Mutation for voting
  const voteMutation = useMutation({
    mutationFn: async (feedbackId: number) => {
      if (!isLoggedIn || !user?.id) {
        throw new Error("User is not logged in");
      }
      return apiRequest("POST", `/api/feedback/${feedbackId}/vote`, {
        orangeId: user.id,
      });
    },
    onSuccess: () => {
      // Invalidate the feedback query using the consistent key format
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/feedback`] });
      
      // Invalidate the user's votes
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "feedback-votes"] });
      
      // Ensure the home page project list is updated with new counts
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to vote",
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  // Auto-vote after login if there's a pending vote
  useEffect(() => {
    console.log("Auto-vote effect running", { 
      isLoggedIn, 
      userId: user?.id, 
      hasFeedbacks: feedbacks && feedbacks.length > 0,
      savedProjectId: sessionStorage.getItem('feedback_project_id'),
      currentProjectId: projectId,
      pendingVoteId: sessionStorage.getItem('vote_feedback_id')
    });
    
    // Only proceed if all required conditions are met
    if (isLoggedIn && user?.id && feedbacks && feedbacks.length > 0) {
      const pendingVoteId = sessionStorage.getItem('vote_feedback_id');
      const savedProjectId = sessionStorage.getItem('feedback_project_id');
      
      // Make sure the pending vote is for this project
      if (pendingVoteId && savedProjectId === projectId.toString()) {
        console.log("Found pending vote:", pendingVoteId, "for project:", savedProjectId);
        
        const feedbackId = parseInt(pendingVoteId, 10);
        const feedbackExists = feedbacks.some(f => f.id === feedbackId);
        const alreadyVoted = userVotes.includes(feedbackId);
        
        console.log("Vote details:", { 
          feedbackExists, 
          alreadyVoted,
          feedbackList: feedbacks.map(f => f.id),
          userVotesList: userVotes
        });
        
        // Only vote if the feedback belongs to this project and isn't already voted
        if (feedbackExists && !alreadyVoted) {
          console.log("Executing auto-vote for feedback:", feedbackId);
          
          // Clear the pending vote first to prevent multiple attempts
          sessionStorage.removeItem('vote_feedback_id');
          sessionStorage.removeItem('feedback_project_id');
          
          // Execute the vote
          setTimeout(() => {
            voteMutation.mutate(feedbackId);
          }, 500);
        } else {
          // Clear the pending vote since we can't execute it
          console.log("Cannot execute vote, clearing storage");
          sessionStorage.removeItem('vote_feedback_id');
          sessionStorage.removeItem('feedback_project_id');
        }
      }
    }
  }, [isLoggedIn, user?.id, feedbacks, userVotes, projectId, voteMutation]);

  const handleVote = (feedbackId: number) => {
    if (!isLoggedIn) {
      // Save the current state before opening login dialog
      sessionStorage.setItem('feedback_project_id', projectId.toString());
      sessionStorage.setItem('vote_feedback_id', feedbackId.toString());
      sessionStorage.setItem('feedback_return_to', window.location.pathname + window.location.search);
      
      setShowLoginDialog(true);
      return;
    }
    voteMutation.mutate(feedbackId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-zinc-800 rounded w-1/4 mb-2"></div>
                <div className="h-8 bg-zinc-800 rounded w-full mb-2"></div>
                <div className="flex justify-between items-center mt-4">
                  <div className="h-4 bg-zinc-800 rounded w-1/6"></div>
                  <div className="h-8 bg-zinc-800 rounded w-24"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!feedbacks || feedbacks.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6 text-center">
          <p className="text-zinc-400">No feedback yet. Be the first to share your thoughts!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {feedbacks.map((feedback) => {
          const isVoted = userVotes.includes(feedback.id);
          
          return (
            <Card key={feedback.id} className="bg-black border border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={feedback.type === "feature" ? "outline" : "destructive"}>
                    {feedback.type === "feature" ? (
                      <><Lightbulb className="h-3 w-3 mr-1" /> Feature</>
                    ) : (
                      <><Bug className="h-3 w-3 mr-1" /> Bug</>
                    )}
                  </Badge>
                  <span className="text-xs text-zinc-500">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-white mb-4">{feedback.content}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">
                    {format(new Date(feedback.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                  
                  <Button
                    variant={isVoted ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleVote(feedback.id)}
                    className={isVoted 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"}
                    disabled={voteMutation.isPending}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    {feedback.upvoteCount}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        message="Please log in to vote on feedback"
      />
    </>
  );
}