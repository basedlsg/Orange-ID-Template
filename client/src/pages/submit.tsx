import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, type InsertProject } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";

export default function Submit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newTool, setNewTool] = useState("");

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

  const handleAddTool = (tool: string) => {
    if (!tool.trim()) return;
    const currentTools = form.getValues("aiTools") || [];
    if (!currentTools.includes(tool)) {
      form.setValue("aiTools", [...currentTools, tool]);
    }
    setNewTool("");
  };

  const handleRemoveTool = (tool: string) => {
    const currentTools = form.getValues("aiTools") || [];
    form.setValue("aiTools", currentTools.filter((t) => t !== tool));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTool(newTool);
    }
  };

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
                      <div className="flex gap-2">
                        <Input
                          value={newTool}
                          onChange={(e) => setNewTool(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type and press Enter to add AI tool"
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