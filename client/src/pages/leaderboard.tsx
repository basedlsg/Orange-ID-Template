import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SiX } from "react-icons/si";
import { Card, CardContent } from "@/components/ui/card";

type LeaderboardEntry = {
  x_handle: string;
  total_projects: number;
  total_likes: number;
};

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    queryFn: async () => {
      const response = await fetch("/api/leaderboard");
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }
      return response.json();
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
        <meta
          name="description"
          content="Discover the most successful AI project creators on VibeCodingList"
        />

        {/* OpenGraph Meta Tags */}
        <meta property="og:title" content="Top Creators - VibeCodingList" />
        <meta property="og:description" content="Discover the most successful AI project creators on VibeCodingList" />
        <meta property="og:image" content={`${window.location.origin}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="VibeCodingList" />

        {/* Twitter Card Meta Tags */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:site" content="@vibecodinglist" />
        <meta property="twitter:title" content="Top Creators - VibeCodingList" />
        <meta property="twitter:description" content="Discover the most successful AI project creators on VibeCodingList" />
        <meta property="twitter:image" content={`${window.location.origin}/og-image.png`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-white">Top Creators</h1>
        <Card className="bg-black border-zinc-800">
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400">Creator</TableHead>
                  <TableHead className="text-right text-zinc-400">Projects</TableHead>
                  <TableHead className="text-right text-zinc-400">Total Likes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard?.map((entry) => (
                  <TableRow key={entry.x_handle} className="border-zinc-800">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        <Link href={`/creator/${entry.x_handle}`} className="flex items-center gap-1 hover:text-blue-400">
                          @{entry.x_handle}
                        </Link>
                        <a
                          href={`https://x.com/${entry.x_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 hover:text-blue-400"
                        >
                          <SiX className="h-4 w-4" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">
                      {entry.total_projects}
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">
                      {entry.total_likes}
                    </TableCell>
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