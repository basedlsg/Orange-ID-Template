import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SiX } from "react-icons/si";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type LeaderboardEntry = {
  x_handle: string;
  total_projects: number;
  total_likes: number;
};

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    queryFn: async () => {
      console.log("Fetching leaderboard data...");
      const response = await fetch("/api/leaderboard");
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }
      const data = await response.json();
      console.log("Received leaderboard data:", data);
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-zinc-800 rounded" />
          <div className="h-[400px] bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Helmet>
        <title>Top Creators - VibeCodingList</title>
        <meta name="description" content="Discover the most successful AI project creators on VibeCodingList" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Top Creators</h1>
        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead className="text-right">Projects</TableHead>
                  <TableHead className="text-right">Total Likes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard?.map((entry) => (
                  <TableRow key={entry.x_handle}>
                    <TableCell className="font-medium">
                      <a
                        href={`https://x.com/${entry.x_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <SiX className="h-4 w-4" />
                        {entry.x_handle}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">{entry.total_projects}</TableCell>
                    <TableCell className="text-right">{entry.total_likes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}