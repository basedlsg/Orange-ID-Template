import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

const advertiseFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().min(2, "Company name must be at least 2 characters"),
  budget: z.string().min(1, "Please select a budget range"),
  message: z.string().min(10, "Please provide more details about your requirements"),
});

type AdvertiseForm = z.infer<typeof advertiseFormSchema>;

export default function Advertise() {
  const { toast } = useToast();
  const form = useForm<AdvertiseForm>({
    resolver: zodResolver(advertiseFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      budget: "",
      message: "",
    },
  });

  async function onSubmit(data: AdvertiseForm) {
    try {
      console.log("Form data being submitted:", data);

      const response = await fetch("/api/advertising-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      console.log("Server response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to submit form");
      }

      toast({
        title: "Form submitted successfully",
        description: "We'll get back to you soon!",
      });

      form.reset();
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: "Error submitting form",
        description: error instanceof Error ? error.message : "Please try again later",
      });
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-6 text-orange-600">Advertise in Orange Vibe Jam</h1>
      <div className="mb-8 space-y-4">
        <p className="text-lg">
          Reach developers and showcase your brand during the <span className="font-semibold text-orange-500">2025 Orange Vibe Jam</span>, a competition with up to $100K USD in prizes.
        </p>
        <p className="text-muted-foreground">
          The Orange Vibe Jam is co-hosted by <span className="font-bold">@Orange_web3</span> and <span className="font-bold">@vibecodinglist</span>, running until April 30, 2025.
          With participating developers creating AI-powered, vibe-coded apps and games, your brand can connect with innovative creators. 
        </p>
        <p className="text-muted-foreground">
          Fill out the form below and we'll help you connect with the Orange Vibe Jam community for sponsorship and advertising opportunities.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input placeholder="Your company name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Range</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your budget range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                    <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                    <SelectItem value="10000-25000">$10,000 - $25,000</SelectItem>
                    <SelectItem value="25000+">$25,000+</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your advertising goals, how you'd like to engage with Orange Vibe Jam participants, and any specific interests in Orange ID integration or other aspects of the competition..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-orange-500 text-white hover:bg-orange-600">
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
}