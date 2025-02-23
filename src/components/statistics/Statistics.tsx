import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessagesSquare, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import { subDays, format, differenceInDays, addDays } from "date-fns";
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StatisticsData {
  totalMessages?: number;
  totalConversations?: number;
  messageTimeSeries?: TimeSeriesData[];
  userTimeSeries?: TimeSeriesData[];
}

interface LoadingState {
  summaryCards: boolean;
  messageChart: boolean;
  userChart: boolean;
}

interface TimeSeriesData {
  date: string;
  value: number;
}

type DateRange = {
  from: Date;
  to: Date;
};

type TimeRange = '7d' | '30d' | '90d' | 'all' | 'custom';

export const Statistics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StatisticsData>({
    totalMessages: 0,
    totalConversations: 0,
    messageTimeSeries: [],
    userTimeSeries: []
  });
  const [loading, setLoading] = useState<LoadingState>({
    summaryCards: true,
    messageChart: true,
    userChart: true
  });
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

  const getTimeFrames = (from: Date, to: Date) => {
    const daysDifference = differenceInDays(to, from);
    
    if (daysDifference <= 30) {
      const timeFrames: { start: Date; end: Date }[] = [];
      let currentDate = from;

      while (currentDate <= to) {
        timeFrames.push({
          start: currentDate,
          end: currentDate
        });
        currentDate = addDays(currentDate, 1);
      }
      return timeFrames;
    }

    let interval = 1;
    if (daysDifference > 90) {
      interval = 30; // Monthly
    } else if (daysDifference > 30) {
      interval = 7; // Weekly
    }

    const timeFrames: { start: Date; end: Date }[] = [];
    let currentDate = from;

    while (currentDate < to) {
      const frameEnd = addDays(currentDate, interval - 1);
      timeFrames.push({
        start: currentDate,
        end: frameEnd > to ? to : frameEnd
      });
      currentDate = addDays(currentDate, interval);
    }

    return timeFrames;
  };

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchSummaryData = async () => {
      if (!user?.organization_id) return;

      setLoading(prev => ({ ...prev, summaryCards: true }));

      try {
        const { data: messageData, error: messageError } = await supabase.functions
          .invoke('get-voiceflow-analytics', {
            body: {
              startDate: dateRange.from.toISOString(),
              endDate: dateRange.to.toISOString(),
            },
          });

        if (messageError) throw messageError;

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

        const totalConversations = conversations.filter((conv: any) => {
          const lastActiveDate = new Date(conv.updatedAt);
          return timeRange === 'all' || (lastActiveDate >= dateRange.from && lastActiveDate <= dateRange.to);
        }).length;

        if (isMounted) {
          setData(prev => ({
            ...prev,
            totalMessages: messageData?.result?.[0]?.count || 0,
            totalConversations
          }));
          setLoading(prev => ({ ...prev, summaryCards: false }));
        }
      } catch (error) {
        if (isMounted && !abortController.signal.aborted) {
          console.error('Error fetching summary statistics:', error);
          toast.error('Kunne ikke hente oppsummeringsdata');
          setLoading(prev => ({ ...prev, summaryCards: false }));
        }
      }
    };

    fetchSummaryData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [user?.organization_id, dateRange, timeRange]);

  useEffect(() => {
    let isMounted = true;

    const fetchMessageTimeSeries = async () => {
      if (!user?.organization_id) return;

      setLoading(prev => ({ ...prev, messageChart: true }));

      try {
        const timeFrames = getTimeFrames(dateRange.from, dateRange.to);
        const messageTimeSeries: TimeSeriesData[] = [];

        for (const frame of timeFrames) {
          const { data: messageData, error: messageError } = await supabase.functions
            .invoke('get-voiceflow-analytics', {
              body: {
                startDate: frame.start.toISOString(),
                endDate: frame.end.toISOString(),
              },
            });

          if (messageError) throw messageError;

          messageTimeSeries.push({
            date: format(frame.start, 'dd.MM'),
            value: messageData?.result?.[0]?.count || 0
          });
        }

        if (isMounted) {
          setData(prev => ({ ...prev, messageTimeSeries }));
          setLoading(prev => ({ ...prev, messageChart: false }));
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching message time series:', error);
          toast.error('Kunne ikke hente meldingsstatistikk over tid');
          setLoading(prev => ({ ...prev, messageChart: false }));
        }
      }
    };

    fetchMessageTimeSeries();

    return () => {
      isMounted = false;
    };
  }, [user?.organization_id, dateRange, timeRange]);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchUserTimeSeries = async () => {
      if (!user?.organization_id) return;

      setLoading(prev => ({ ...prev, userChart: true }));

      try {
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
        const timeFrames = getTimeFrames(dateRange.from, dateRange.to);
        const userTimeSeries: TimeSeriesData[] = [];

        for (const frame of timeFrames) {
          const userCount = conversations.filter((conv: any) => {
            const lastActiveDate = new Date(conv.updatedAt);
            return lastActiveDate >= frame.start && lastActiveDate <= frame.end;
          }).length;

          userTimeSeries.push({
            date: format(frame.start, 'dd.MM'),
            value: userCount
          });
        }

        if (isMounted) {
          setData(prev => ({ ...prev, userTimeSeries }));
          setLoading(prev => ({ ...prev, userChart: false }));
        }
      } catch (error) {
        if (isMounted && !abortController.signal.aborted) {
          console.error('Error fetching user time series:', error);
          toast.error('Kunne ikke hente brukerstatistikk over tid');
          setLoading(prev => ({ ...prev, userChart: false }));
        }
      }
    };

    fetchUserTimeSeries();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [user?.organization_id, dateRange, timeRange]);

  const renderLineChart = (
    data: TimeSeriesData[] | undefined,
    title: string,
    color: string = "#28483F",
    isLoading: boolean
  ) => (
    <Card className="w-full h-[400px]">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader size="md" />
          </div>
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="date"
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Ingen data tilgjengelig
          </div>
        )}
      </CardContent>
    </Card>
  );

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
            {loading.summaryCards ? (
              <div className="flex items-center justify-center py-4">
                <Loader size="sm" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data.totalMessages?.toLocaleString('no') ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Antall meldinger sendt
                </p>
              </>
            )}
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
            {loading.summaryCards ? (
              <div className="flex items-center justify-center py-4">
                <Loader size="sm" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data.totalConversations?.toLocaleString('no') ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Totalt antall forskjellige brukere
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 mt-8">
        {renderLineChart(data.userTimeSeries, "Brukere over tid", "#E2B808", loading.userChart)}
        {renderLineChart(data.messageTimeSeries, "Meldinger over tid", "#28483F", loading.messageChart)}
      </div>
    </div>
  );
};
