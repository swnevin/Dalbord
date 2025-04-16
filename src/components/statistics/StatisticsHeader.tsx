
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { useState } from "react";
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Simulate refreshing data
    setTimeout(() => {
      // Trigger a re-fetch by slightly changing the date range and then changing it back
      const currentFrom = new Date(dateRange.from);
      const currentTo = new Date(dateRange.to);
      
      onDateRangeChange({
        ...dateRange,
        from: new Date(currentFrom.setMilliseconds(currentFrom.getMilliseconds() + 1)),
        to: new Date(currentTo.setMilliseconds(currentTo.getMilliseconds() + 1))
      });
      
      setIsRefreshing(false);
    }, 750);
  };

  return (
    <div className="bg-white dark:bg-gray-950 py-4 px-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Statistikk</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Oversikt over chatbot-ytelse og brukerinteraksjoner
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-[160px]">
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
                  <Button variant="outline" className="w-[130px] pl-3 pr-2 justify-between">
                    <span>{format(dateRange.from, 'dd.MM.yyyy')}</span>
                    <CalendarIcon className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && onDateRangeChange({ ...dateRange, from: date })}
                    initialFocus
                    locale={nb}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[130px] pl-3 pr-2 justify-between">
                    <span>{format(dateRange.to, 'dd.MM.yyyy')}</span>
                    <CalendarIcon className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && onDateRangeChange({ ...dateRange, to: date })}
                    initialFocus
                    locale={nb}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Oppdater data</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
