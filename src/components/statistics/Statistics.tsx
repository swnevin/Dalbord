import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessagesSquare, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import { subDays, format, eachDayOfInterval } from "date-fns";
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatisticsData {
  totalMessages: number;
  totalConversations: number;
}

type DateRange = {
  from: Date;
  to: Date;
};

type TimeRange = '1w' | '2w' | '4w' | '3m' | 'custom';

interface TimeSeriesData {
  date: string;
  value: number;
}

export const Statistics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('1w');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [messagesSeries, setMessagesSeries] = useState<TimeSeriesData[]>([]);
  const [usersSeries, setUsersSeries] = useState<TimeSeriesData[]>([]);

  const updateDateRange = (range: TimeRange) => {
    const now = new Date();
    let from = now;

    switch (range) {
      case '1w':
        from = subDays(now, 7);
        break;
      case '2w':
        from = subDays(now, 14);
        break;
      case '4w':
        from = subDays(now, 28);
        break;
      case '3m':
        from = subDays(now, 90);
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
    const fetchStatistics = async () => {
      if (!user?.organization_id) return;
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

        // Fetch conversations and filter by date range
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
          }
        );

        if (!conversationsResponse.ok) {
          throw new Error('Failed to fetch conversations');
        }

        const conversations = await conversationsResponse.json();
        
        // Filter conversations within date range
        const filteredConversations = conversations.filter((conv: any) => {
          const convDate = new Date(conv.createdAt);
          return convDate >= dateRange.from && convDate <= dateRange.to;
        });

        // Get total interactions from the response
        const totalInteractions = messageData?.result?.[0]?.count || 0;

        // Create a continuous array of dates
        const dateRangeInterval = eachDayOfInterval({
          start: dateRange.from,
          end: dateRange.to
        });

        // Initialize user counts for each day
        const usersByDate: { [key: string]: Set<string> } = {};
        dateRangeInterval.forEach(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          usersByDate[dateStr] = new Set<string>();
        });

        // Count unique users per day from all conversations
        conversations.forEach((conv: any) => {
          const convDate = new Date(conv.createdAt);
          const dateStr = format(convDate, 'yyyy-MM-dd');
          
          // Only count if the date is within our range
          if (convDate >= dateRange.from && convDate <= dateRange.to && usersByDate[dateStr]) {
            if (conv.userId) {
              usersByDate[dateStr].add(conv.userId);
            }
          }
        });

        // Convert to time series format and sort by date
        const usersTimeSeries = Object.entries(usersByDate)
          .map(([date, users]) => ({
            date,
            value: users.size
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setUsersSeries(usersTimeSeries);
        setData({
          totalMessages: totalInteractions,
          totalConversations: filteredConversations.length,
        });

        // Fetch daily message counts
        const dailyMessagePromises = [];
        let currentDate = new Date(dateRange.from);
        while (currentDate <= dateRange.to) {
          const endDate = new Date(currentDate);
          endDate.setHours(23, 59, 59, 999);
          
          dailyMessagePromises.push(
            supabase.functions.invoke('get-voiceflow-analytics', {
              body: {
                startDate: currentDate.toISOString(),
                endDate: endDate.toISOString(),
              },
            })
          );
          
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        const dailyResults = await Promise.all(dailyMessagePromises);
        const messagesTimeSeries = dailyResults.map((result, index) => {
          const date = new Date(dateRange.from);
          date.setDate(date.getDate() + index);
          return {
            date: format(date, 'yyyy-MM-dd'),
            value: result.data?.result?.[0]?.count || 0,
          };
        });

        setMessagesSeries(messagesTimeSeries);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        toast.error('Kunne ikke hente statistikk');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, [user?.organization_id, dateRange]);

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
              <SelectItem value="1w">Siste uke</SelectItem>
              <SelectItem value="2w">Siste 2 uker</SelectItem>
              <SelectItem value="4w">Siste 4 uker</SelectItem>
              <SelectItem value="3m">Siste 3 måneder</SelectItem>
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
              {data.totalMessages.toLocaleString('no')}
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
              {data.totalConversations.toLocaleString('no')}
            </div>
            <p className="text-xs text-muted-foreground">
              Antall unike brukere
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Meldinger over tid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={messagesSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'dd.MM')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'dd.MM.yyyy')}
                    formatter={(value: number) => [value.toLocaleString('no'), 'Meldinger']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#28483F" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unike brukere over tid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usersSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'dd.MM')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'dd.MM.yyyy')}
                    formatter={(value: number) => [value.toLocaleString('no'), 'Brukere']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#E2B808" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
