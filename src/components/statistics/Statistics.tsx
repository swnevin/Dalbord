import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessagesSquare, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import { subDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatisticsData {
  totalMessages: number;
  totalConversations: number;
}

type DateRange = {
  from: Date;
  to: Date;
};

type TimeRange = '7d' | '30d' | '90d' | 'all' | 'custom';

export const Statistics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date()
  });

  const updateDateRange = (range: TimeRange) => {
    const now = new Date();
    let from = now;

    switch (range) {
      case '7d':
        from = subDays(now, 7);
        break;
      case '30d':
        from = subDays(now, 30);
        break;
      case '90d':
        from = subDays(now, 90);
        break;
      case 'all':
        from = new Date(0); // Beginning of time
        break;
      case 'custom':
        return; // Don't update dates for custom range
    }

    setDateRange({ from, to: now });
  };

  useEffect(() => {
    if (timeRange !== 'custom') {
      updateDateRange(timeRange);
    }
  }, [timeRange]);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchStatistics = async () => {
      if (!user?.organization_id) return;
      
      // Reset data and set loading state
      setData(null);
      setIsLoading(true);

      try {
        // Fetch messages count from edge function
        const { data: messageData, error: messageError } = await supabase.functions
          .invoke('get-voiceflow-analytics', {
            body: {
              startDate: dateRange.from.toISOString(),
              endDate: dateRange.to.toISOString(),
            },
          });

        if (messageError) throw messageError;

        // Fetch conversations
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('voiceflow_api_key, voiceflow_project_id')
          .eq('id', user.organization_id)
          .single();

        if (orgError) throw orgError;
        
        const conversationsResponse = await fetch(
          `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}`,
          {
            headers: {
              Authorization: org.voiceflow_api_key,
              'Content-Type': 'application/json',
            },
            signal: abortController.signal,
          }
        );

        if (!conversationsResponse.ok) {
          throw new Error('Failed to fetch conversations');
        }

        const conversations = await conversationsResponse.json();
        
        // Only update state if the component is still mounted
        if (isMounted) {
          // Count contacts within the time frame using updatedAt
          let contactCount = 0;
          
          conversations.forEach((conv: any) => {
            const lastActiveDate = new Date(conv.updatedAt);
            // For 'all' time range, count everything
            if (timeRange === 'all' || (lastActiveDate >= dateRange.from && lastActiveDate <= dateRange.to)) {
              contactCount++;
            }
          });

          // Get total interactions from the response
          const totalInteractions = messageData?.result?.[0]?.count || 0;

          setData({
            totalMessages: totalInteractions,
            totalConversations: contactCount
          });
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted && !abortController.signal.aborted) {
          console.error('Error fetching statistics:', error);
          toast.error('Kunne ikke hente statistikk');
          setIsLoading(false);
        }
      }
    };

    fetchStatistics();

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [user?.organization_id, dateRange, timeRange]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-primary mb-4">Statistikk</h1>
        <p className="text-muted-foreground">Ingen data tilgjengelig</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Statistikk</h1>
        
        <div className="flex gap-4 items-center">
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Velg tidsperiode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Siste 7 dager</SelectItem>
              <SelectItem value="30d">Siste 30 dager</SelectItem>
              <SelectItem value="90d">Siste 90 dager</SelectItem>
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
                    onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
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
                    onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Antall meldinger
            </CardTitle>
            <MessagesSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalMessages.toLocaleString('no')}
            </div>
            <p className="text-xs text-muted-foreground">
              Antall meldinger sendt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Antall Brukere
            </CardTitle>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalConversations.toLocaleString('no')}
            </div>
            <p className="text-xs text-muted-foreground">
              Totalt antall forskjellige brukere
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
