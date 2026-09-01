
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { DateRange, TimeRange } from "./types";

interface StatisticsHeaderProps {
  timeRange: TimeRange;
  dateRange: DateRange;
  onTimeRangeChange: (value: TimeRange) => void;
  onDateRangeChange: (range: DateRange) => void;
}

export const StatisticsHeader = ({
  timeRange,
  dateRange,
  onTimeRangeChange,
  onDateRangeChange,
}: StatisticsHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <h1 className="text-3xl font-bold text-primary">Statistikk</h1>
      
      <div className="flex gap-2 items-center">
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Velg tidsperiode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Siste 7 dager</SelectItem>
            <SelectItem value="30d">Siste 30 dager</SelectItem>
            <SelectItem value="90d">Siste 90 dager</SelectItem>
            <SelectItem value="365d">Siste 365 dager</SelectItem>
            <SelectItem value="all">All tid</SelectItem>
            <SelectItem value="custom">Egendefinert</SelectItem>
          </SelectContent>
        </Select>

        {timeRange === 'custom' && (
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  {format(dateRange.from, 'dd.MM.yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => date && onDateRangeChange({ ...dateRange, from: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  {format(dateRange.to, 'dd.MM.yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => date && onDateRangeChange({ ...dateRange, to: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
};
