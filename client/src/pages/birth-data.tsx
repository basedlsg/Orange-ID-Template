import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBedrockPassport } from "@bedrock_org/passport";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export default function BirthDataPage() {
  const { isLoggedIn, user } = useBedrockPassport();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  
  // Query to fetch existing birth data
  const { 
    data: birthData, 
    isLoading, 
    error,
    isError 
  } = useQuery<BirthData>({
    queryKey: ["/api/birth-data"],
    queryFn: async () => {
      try {
        return await apiRequest("/api/birth-data", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        // If we get a 404, it means the user doesn't have birth data yet
        // We'll handle this in the UI by showing the form
        if (err instanceof Error && err.message.includes("404")) {
          console.log("No birth data found, will show form for initial data entry");
          return null;
        }
        throw err;
      }
    },
    enabled: !!isLoggedIn,
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
      return apiRequest("/api/birth-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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