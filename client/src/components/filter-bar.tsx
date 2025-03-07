import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterBarProps {
  sortBy: string;
  onSortChange: (value: string) => void;
}

export function FilterBar({ sortBy, onSortChange }: FilterBarProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <h2 className="text-2xl font-bold">Projects</h2>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="views">Most Viewed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
