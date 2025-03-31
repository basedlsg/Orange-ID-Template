import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useBedrockPassport } from "@bedrock_org/passport";
import { LoginDialog } from "./login-dialog";
import { LogIn } from "lucide-react";

const feedbackSchema = z.object({
  content: z.string().min(5, "Feedback must be at least 5 characters").max(500, "Feedback must be 500 characters or less"),
  type: z.enum(["feature", "bug"], {
    required_error: "Please select a feedback type",
  }),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

interface FeedbackFormProps {
  projectId: number;
  onSuccess?: () => void;
}

export function FeedbackForm({ projectId, onSuccess }: FeedbackFormProps) {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { isLoggedIn, user } = useBedrockPassport();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      content: "",
      type: "feature",
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (values: FeedbackFormValues) => {
      if (!isLoggedIn || !user?.id) {
        throw new Error("User is not logged in");
      }
      
      return apiRequest("POST", `/api/projects/${projectId}/feedback`, {
        ...values,
        orangeId: user.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
      form.reset();
      
      // Invalidate the project feedbacks query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "feedback"] });
      
      // Also invalidate the cached feedback count for project cards
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/feedback`] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to submit feedback",
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  const onSubmit = (data: FeedbackFormValues) => {
    if (!isLoggedIn) {
      setShowLoginDialog(true);
      return;
    }
    
    feedbackMutation.mutate(data);
  };
  
  const handleLoginClick = () => {
    setShowLoginDialog(true);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3 pt-4">
                <FormLabel className="text-zinc-300">Feedback Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                    disabled={!isLoggedIn}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="feature" id="feature" disabled={!isLoggedIn} />
                      <label 
                        htmlFor="feature" 
                        className={`${isLoggedIn ? 'text-zinc-300 cursor-pointer' : 'text-zinc-500 cursor-not-allowed'}`}
                      >
                        Feature Request
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bug" id="bug" disabled={!isLoggedIn} />
                      <label 
                        htmlFor="bug" 
                        className={`${isLoggedIn ? 'text-zinc-300 cursor-pointer' : 'text-zinc-500 cursor-not-allowed'}`}
                      >
                        Bug Report
                      </label>
                    </div>
                  </RadioGroup>
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
                <FormLabel className="text-zinc-300">Your Feedback</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={isLoggedIn ? 
                      "Share your thoughts, suggestions or report issues..." : 
                      "Please log in to share your feedback..."
                    }
                    className="bg-zinc-900 border-zinc-700 resize-none h-24 text-white"
                    disabled={!isLoggedIn}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isLoggedIn ? (
            <Button 
              type="submit" 
              disabled={feedbackMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {feedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>
          ) : (
            <Button 
              type="button"
              onClick={handleLoginClick}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Log in to share feedback
            </Button>
          )}
        </form>
      </Form>
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        message="Please log in to submit feedback"
      />
    </>
  );
}