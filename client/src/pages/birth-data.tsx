import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBedrockPassport } from "@bedrock_org/passport";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getOrangeId } from "../App";

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
import { MapPin, Calendar, Clock } from "lucide-react";

// Create birth data form schema
const birthDataSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format"
  }),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, {
    message: "Time must be in HH:MM format (24-hour)"
  }).optional(),
  birthLocation: z.string().min(2, {
    message: "Location must be at least 2 characters"
  }).optional(),
  birthLatitude: z.preprocess(
    (val) => val === "" ? undefined : Number(val),
    z.number().min(-90).max(90).optional()
  ),
  birthLongitude: z.preprocess(
    (val) => val === "" ? undefined : Number(val),
    z.number().min(-180).max(180).optional()
  ),
});

type BirthDataFormValues = z.infer<typeof birthDataSchema>;

// Define the BedrockUser type to match what's returned from Bedrock Passport
interface BedrockUser {
  id?: string;
  sub?: string; // ID field from Bedrock Passport
  name?: string;
  email?: string;
  // Add other fields as needed
}

export default function BirthDataPage() {
  const { isLoggedIn, user } = useBedrockPassport();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Cast the user to the correct type
  const typedUser = user as BedrockUser | undefined;

  // Define the birth data interface
  interface BirthData {
    id: number;
    userId: number;
    birthDate: string;
    birthTime?: string;
    birthLocation?: string;
    birthLatitude?: number;
    birthLongitude?: number;
    createdAt: string;
  }
  
  // Query to fetch existing birth data with special handling for 404 errors
  const { 
    data: birthData, 
    isLoading, 
    error,
    isError,
    refetch 
  } = useQuery<BirthData | null>({
    queryKey: ["/api/birth-data"],
    queryFn: async () => {
      try {
        // Get orangeId from multiple sources for redundancy
        let orangeId = typedUser?.sub || typedUser?.id;
        
        // If not found in user object, try localStorage
        if (!orangeId) {
          const storedOrangeId = getOrangeId();
          if (storedOrangeId) {
            orangeId = storedOrangeId;
            console.log("Using orangeId from localStorage:", orangeId);
          }
        } else {
          console.log("Using orangeId from user object:", orangeId);
        }
        
        if (!orangeId) {
          throw new Error("No orangeId available. Cannot authenticate request. Please try logging out and logging in again.");
        }

        return await apiRequest(`/api/birth-data?orangeId=${orangeId}`, {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
          },
          // Add orangeId as a query parameter to ensure authentication works
          // even if the session is not properly maintained
          credentials: "include"
        });
      } catch (err) {
        // If we get a 404, it means the user doesn't have birth data yet
        // We'll handle this in the UI by showing the form for initial entry
        if (err instanceof Error && err.message.includes("404")) {
          console.log("No birth data found, showing form for initial data entry");
          return null;
        }
        
        // For authentication errors, try to refresh the page or notify the user
        if (err instanceof Error && err.message.includes("401")) {
          console.log("Authentication error in birth data fetch, might need to login again");
          console.log("User authenticated status:", isLoggedIn);
          console.log("User object:", typedUser);
          console.log("orangeId from localStorage:", getOrangeId());
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "There was a problem authenticating your request. Try logging out and logging in again.",
          });
        }
        
        // For other errors, rethrow
        throw err;
      }
    },
    retry: false, // Don't retry 404 errors
    retryOnMount: false,
    enabled: !!isLoggedIn && !!typedUser,
  });

  // Create form with react-hook-form
  const form = useForm<BirthDataFormValues>({
    resolver: zodResolver(birthDataSchema),
    defaultValues: {
      birthDate: "",
      birthTime: "",
      birthLocation: "",
      birthLatitude: undefined,
      birthLongitude: undefined,
    },
  });

  // Update form values when birth data is loaded
  useEffect(() => {
    if (birthData) {
      form.reset({
        birthDate: birthData.birthDate || "",
        birthTime: birthData.birthTime || "",
        birthLocation: birthData.birthLocation || "",
        birthLatitude: birthData.birthLatitude,
        birthLongitude: birthData.birthLongitude,
      });
    }
  }, [birthData, form]);

  // Save birth data mutation
  const saveBirthData = useMutation({
    mutationFn: async (data: BirthDataFormValues) => {
      // Extract user ID from Bedrock Passport if available
      const orangeId = typedUser?.sub || typedUser?.id;
      console.log("Current user orangeId for birth data saving:", orangeId);
      
      if (!orangeId) {
        throw new Error("No orangeId available. Cannot authenticate request.");
      }
      
      // Include orangeId in the request to ensure auth works
      // even if session cookies aren't working properly
      return apiRequest(`/api/birth-data?orangeId=${orangeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
    },
    onSuccess: () => {
      toast({
        title: "Birth data saved!",
        description: "Your birth information has been saved successfully.",
      });
      // Invalidate the query to refetch the data
      queryClient.invalidateQueries({ queryKey: ["/api/birth-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/natal-chart"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error saving birth data",
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  // Submit form handler
  const onSubmit = async (data: BirthDataFormValues) => {
    try {
      setIsSubmitting(true);
      await saveBirthData.mutateAsync(data);
    } catch (error) {
      console.error("Error saving birth data:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card className="bg-black border border-gray-800">
          <CardHeader>
            <CardTitle className="text-[#F37920]">Birth Information</CardTitle>
            <CardDescription>Loading your birth data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <div className="animate-pulse text-[#F37920]">Loading...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state for non-404 errors
  if (error && !(error instanceof Error && error.message.includes("404"))) {
    return (
      <div className="container mx-auto py-10">
        <Card className="bg-black border border-gray-800">
          <CardHeader>
            <CardTitle className="text-[#F37920]">Birth Information</CardTitle>
            <CardDescription>There was an error loading your birth data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex flex-col items-center justify-center text-red-500">
              <p className="mb-4">Error: {error instanceof Error ? error.message : "Unknown error"}</p>
              <Button 
                variant="outline" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/birth-data"] })}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="bg-black border border-gray-800 text-white">
        <CardHeader>
          <CardTitle className="text-[#F37920] text-2xl">Birth Information</CardTitle>
          <CardDescription>
            Enter your birth details to generate your natal chart and receive personalized astrological insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Birth Date */}
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-[#F37920]" />
                      Birth Date
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="YYYY-MM-DD"
                        type="date"
                        {...field}
                        className="bg-gray-900 border-gray-700"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your birth date in the format YYYY-MM-DD
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Birth Time */}
              <FormField
                control={form.control}
                name="birthTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-[#F37920]" />
                      Birth Time (optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="HH:MM"
                        type="time"
                        {...field}
                        value={field.value || ""}
                        className="bg-gray-900 border-gray-700"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your birth time in 24-hour format for a more accurate chart
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Birth Location */}
              <FormField
                control={form.control}
                name="birthLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-[#F37920]" />
                      Birth Location (optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="City, Country"
                        {...field}
                        value={field.value || ""}
                        className="bg-gray-900 border-gray-700"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the city and country where you were born
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Birth Latitude */}
                <FormField
                  control={form.control}
                  name="birthLatitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="e.g. 40.7128"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                          className="bg-gray-900 border-gray-700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Birth Longitude */}
                <FormField
                  control={form.control}
                  name="birthLongitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="e.g. -74.0060"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                          className="bg-gray-900 border-gray-700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-[#F37920] hover:bg-[#D86A10]"
                >
                  {isSubmitting ? "Saving..." : birthData ? "Update Birth Data" : "Save Birth Data"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <Separator className="mb-4" />
          <p className="text-sm text-gray-400">
            Your birth data is used to calculate your natal chart and provide personalized astrological insights.
            For the most accurate readings, please provide as much information as possible, especially your birth time.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}