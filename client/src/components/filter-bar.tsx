import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PREDEFINED_AI_TOOLS } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FilterBarProps {
  sortBy: string;
  aiTool: string;
  sponsorshipFilter: boolean;
  onSortChange: (value: string) => void;
  onAiToolChange: (value: string) => void;
  onSponsorshipFilterChange: (value: boolean) => void;
}

export function FilterBar({ 
  sortBy, 
  aiTool, 
  sponsorshipFilter,
  onSortChange, 
  onAiToolChange,
  onSponsorshipFilterChange 
}: FilterBarProps) {
  return (
    <div className="mb-8 space-y-4">
      <h2 className="text-2xl font-bold">Projects</h2>
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="views">Most Viewed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={aiTool} onValueChange={onAiToolChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by AI Tool..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tools</SelectItem>
            {PREDEFINED_AI_TOOLS.map((tool) => (
              <SelectItem key={tool} value={tool}>{tool}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Switch
            id="sponsorship-filter"
            checked={sponsorshipFilter}
            onCheckedChange={onSponsorshipFilterChange}
          />
          <Label htmlFor="sponsorship-filter" className="text-sm text-zinc-400">
            Open for Sponsorship
          </Label>
        </div>
      </div>
    </div>
  );
}