import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SiX } from "react-icons/si";

type LeaderboardEntry = {
  x_handle: string;
  total_projects: number;
  total_likes: number;
};

export function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Creators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Creators</CardTitle>
      </CardHeader>
      <CardContent>
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
  );
}
