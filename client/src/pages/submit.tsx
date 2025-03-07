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
import { Checkbox } from "@/components/ui/checkbox";

export default function Submit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      url: "",
      aiTools: [],
      customAiTools: [],
      thumbnail: "",
      xHandle: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: InsertProject) => {
      // Handle file upload if a file is selected
      if (data.thumbnailFile instanceof File) {
        const formData = new FormData();
        formData.append("thumbnail", data.thumbnailFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const { url } = await uploadRes.json();
        data.thumbnail = url;
      }
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
              <div>
                <FormLabel className="text-zinc-400">AI Tools Used</FormLabel>
                {PREDEFINED_AI_TOOLS.map((tool) => (
                  <FormField
                    key={tool}
                    control={form.control}
                    name="aiTools"
                    render={({ field }) => {
                      return (
                        <FormItem key={tool} className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(tool)}
                              onCheckedChange={(checked) => {
                                const values = checked
                                  ? [...(field.value || []), tool]
                                  : field.value?.filter((value) => value !== tool) || [];
                                field.onChange(values);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-zinc-400">{tool}</FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
                <FormMessage />
              </div>
              <FormField
                control={form.control}
                name="customAiTools"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-400">Other AI Tools (comma-separated)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        className="bg-zinc-900 border-zinc-700 text-white"
                        onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="thumbnailFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-400">Thumbnail Image</FormLabel>
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