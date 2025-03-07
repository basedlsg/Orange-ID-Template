import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProjectCardSkeleton() {
  return (
    <Card className="overflow-hidden bg-black border-zinc-800">
      <div className="aspect-video bg-zinc-900 animate-pulse" />
      <CardHeader className="p-4">
        <div className="h-6 w-2/3 bg-zinc-800 rounded animate-pulse" />
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
        <div className="flex flex-wrap gap-2">
          <div className="h-5 w-20 bg-zinc-800 rounded-full animate-pulse" />
          <div className="h-5 w-24 bg-zinc-800 rounded-full animate-pulse" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
          <div className="h-8 w-20 bg-zinc-800 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
