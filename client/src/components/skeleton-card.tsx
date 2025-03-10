import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SkeletonCard() {
  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg bg-black border-zinc-800">
      <div className="aspect-video overflow-hidden bg-zinc-900 animate-pulse" />
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
          <div className="h-6 w-12 bg-zinc-800 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="flex flex-wrap gap-2 my-4">
          <div className="h-6 w-20 bg-zinc-800 rounded animate-pulse" />
          <div className="h-6 w-24 bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="h-8 w-20 bg-zinc-800 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
