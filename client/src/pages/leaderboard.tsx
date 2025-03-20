import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SiX } from "react-icons/si";
import { TimeFilter } from "@shared/schema";

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["/api/leaderboard", timeFilter],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?timeFilter=${timeFilter}`);
      if (!response.ok) throw new Error("Failed to fetch leaderboard");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Creator Leaderboard</h1>
        <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="monthly">This Month</SelectItem>
            <SelectItem value="weekly">This Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[600px] rounded-md border">
        <div className="space-y-4 p-4">
          {leaderboard?.map((entry: any, index: number) => (
            <Card key={entry.xHandle}>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                    <Link href={`/creator/${entry.xHandle}`} className="hover:underline">
                      <CardTitle className="flex items-center gap-2">
                        <SiX className="h-5 w-5" />
                        {entry.xHandle}
                      </CardTitle>
                    </Link>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div>
                      <span className="font-bold text-foreground">{entry.totalLikes}</span> Likes
                    </div>
                    <div>
                      <span className="font-bold text-foreground">{entry.projectCount}</span> Projects
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
