import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PREDEFINED_AI_TOOLS } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FilterBarProps {
  sortBy: string;
  aiTool: string;
  sponsorshipFilter: boolean;
  searchQuery: string;
  onSortChange: (value: string) => void;
  onAiToolChange: (value: string) => void;
  onSponsorshipFilterChange: (value: boolean) => void;
  onSearchChange: (value: string) => void;
}

export function FilterBar({
  sortBy,
  aiTool,
  sponsorshipFilter,
  searchQuery,
  onSortChange,
  onAiToolChange,
  onSponsorshipFilterChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-4 items-center">
      <div className="relative flex-1 min-w-[280px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
        />
      </div>

      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="likes">Most Liked</SelectItem>
          <SelectItem value="views">Most Viewed</SelectItem>
          <SelectItem value="newest">Newest First</SelectItem>
        </SelectContent>
      </Select>

      <Select value={aiTool} onValueChange={onAiToolChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by AI Tool..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tools</SelectItem>
          {PREDEFINED_AI_TOOLS.map((tool) => (
            <SelectItem key={tool} value={tool}>
              {tool}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center space-x-2">
        <Switch
          id="sponsorship-filter"
          checked={sponsorshipFilter}
          onCheckedChange={onSponsorshipFilterChange}
          className="data-[state=unchecked]:bg-gray-800 data-[state=unchecked]:border-blue-400 hover:data-[state=unchecked]:border-blue-600"
        />
        <Label htmlFor="sponsorship-filter" className="text-sm text-zinc-400">
          Open for Sponsorship
        </Label>
      </div>
    </div>
  );
}