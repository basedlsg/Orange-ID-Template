import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, type InsertProject, PREDEFINED_AI_TOOLS } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Submit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      url: "",
      aiTool: "Other",
      thumbnail: "",
      xHandle: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: InsertProject) => {
      await apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project submitted for review",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit project",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card className="bg-black border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Submit a Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-6">
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
                    <FormLabel className="text-zinc-400">Description (max 100 characters)</FormLabel>
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
                name="aiTool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-400">AI Tool Used</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                          <SelectValue placeholder="Select AI Tool" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        {PREDEFINED_AI_TOOLS.map((tool) => (
                          <SelectItem key={tool} value={tool} className="text-white hover:bg-zinc-800">
                            {tool}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("aiTool") === "Other" && (
                <FormField
                  control={form.control}
                  name="customAiTool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400">Specify AI Tool</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-zinc-900 border-zinc-700 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-400">Thumbnail URL</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" className="bg-zinc-900 border-zinc-700 text-white" />
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
                    <FormLabel className="text-zinc-400">X Handle (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-zinc-900 border-zinc-700 text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending} className="bg-blue-500 hover:bg-blue-600 text-white">
                Submit Project
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}