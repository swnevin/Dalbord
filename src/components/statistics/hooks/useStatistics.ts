import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { StatisticsData, LoadingState, DateRange, TimeRange, SavingsSettings, TimeSeriesData, IntentData, FeedbackTimeSeriesData, MetricsResponse } from "../types";
import { getTimeFrames, formatDateLabel } from "../utils/dateUtils";

export const useStatistics = (
  dateRange: DateRange,
  timeRange: TimeRange,
  savingsSettings: SavingsSettings
) => {
  const { user } = useAuth();
  const [data, setData] = useState<StatisticsData>({
    totalMessages: 0,
    totalConversations: 0,
    totalSessions: 0,
    messageTimeSeries: [],
    userTimeSeries: [],
    sessionTimeSeries: [],
    topIntents: [],
    timeSaved: 0,
    moneySaved: 0,
    happyFaceCount: 0,
    neutralFaceCount: 0,
    sadFaceCount: 0,
    escalatedCount: 0,
    feedbackTimeSeries: [],
    escalationTimeSeries: []
  });
  const [loading, setLoading] = useState<LoadingState>({
    summaryCards: true,
    messageChart: true,
    userChart: true,
    sessionChart: true,
    intentChart: true,
    feedbackChart: true,
    escalationChart: true
  });

  // Calculate savings whenever total messages or settings change
  useEffect(() => {
    if (data.totalMessages) {
      const timeSaved = data.totalMessages * savingsSettings.timePerMessage;
      const moneySaved = (timeSaved / 60) * savingsSettings.hourlyRate;
      
      setData(prev => ({
        ...prev,
        timeSaved,
        moneySaved
      }));
    }
  }, [data.totalMessages, savingsSettings]);

  // Fetch summary data (total messages, sessions and conversations)
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchSummaryData = async () => {
      if (!user?.organization_id) return;

      setLoading(prev => ({ ...prev, summaryCards: true }));

      try {
        // Fetch message counts
        const { data: messageData, error: messageError } = await supabase.functions
          .invoke('get-voiceflow-analytics', {
            body: {
              startDate: dateRange.from.toISOString(),
              endDate: dateRange.to.toISOString(),
              queryType: 'interactions'
            },
          });

        if (messageError) throw messageError;

        // Fetch session counts
        const { data: sessionData, error: sessionError } = await supabase.functions
          .invoke('get-voiceflow-analytics', {
            body: {
              startDate: dateRange.from.toISOString(),
              endDate: dateRange.to.toISOString(),
              queryType: 'sessions'
            },
          });

        if (sessionError) throw sessionError;

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
            totalSessions: sessionData?.result?.[0]?.count || 0,
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

  // Fetch message time series data
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchMessageTimeSeries = async () => {
      if (!user?.organization_id) return;

      setLoading(prev => ({ ...prev, messageChart: true }));

      try {
        const timeFrames = getTimeFrames(dateRange.from, dateRange.to);
        const messageTimeSeries: TimeSeriesData[] = [];
        const daysDiff = differenceInDays(dateRange.to, dateRange.from);

        for (const frame of timeFrames) {
          if (daysDiff <= 30) {
            const startOfDay = new Date(frame.start);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(frame.start);
            endOfDay.setHours(23, 59, 59, 999);

            const { data: messageData, error: messageError } = await supabase.functions
              .invoke('get-voiceflow-analytics', {
                body: {
                  startDate: startOfDay.toISOString(),
                  endDate: endOfDay.toISOString(),
                  queryType: 'interactions'
                },
              });

            if (messageError) throw messageError;

            messageTimeSeries.push({
              date: formatDateLabel(frame.start, daysDiff),
              value: messageData?.result?.[0]?.count || 0
            });
          } else {
            const { data: messageData, error: messageError } = await supabase.functions
              .invoke('get-voiceflow-analytics', {
                body: {
                  startDate: frame.start.toISOString(),
                  endDate: frame.end.toISOString(),
                  queryType: 'interactions'
                },
              });

            if (messageError) throw messageError;

            messageTimeSeries.push({
              date: formatDateLabel(frame.start, daysDiff),
              value: messageData?.result?.[0]?.count || 0
            });
          }
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

  // Fetch session time series data
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchSessionTimeSeries = async () => {
      if (!user?.organization_id) return;

      setLoading(prev => ({ ...prev, sessionChart: true }));

      try {
        const timeFrames = getTimeFrames(dateRange.from, dateRange.to);
        const sessionTimeSeries: TimeSeriesData[] = [];
        const daysDiff = differenceInDays(dateRange.to, dateRange.from);

        for (const frame of timeFrames) {
          if (daysDiff <= 30) {
            const startOfDay = new Date(frame.start);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(frame.start);
            endOfDay.setHours(23, 59, 59, 999);

            const { data: sessionData, error: sessionError } = await supabase.functions
              .invoke('get-voiceflow-analytics', {
                body: {
                  startDate: startOfDay.toISOString(),
                  endDate: endOfDay.toISOString(),
                  queryType: 'sessions'
                },
              });

            if (sessionError) throw sessionError;

            sessionTimeSeries.push({
              date: formatDateLabel(frame.start, daysDiff),
              value: sessionData?.result?.[0]?.count || 0
            });
          } else {
            const { data: sessionData, error: sessionError } = await supabase.functions
              .invoke('get-voiceflow-analytics', {
                body: {
                  startDate: frame.start.toISOString(),
                  endDate: frame.end.toISOString(),
                  queryType: 'sessions'
                },
              });

            if (sessionError) throw sessionError;

            sessionTimeSeries.push({
              date: formatDateLabel(frame.start, daysDiff),
              value: sessionData?.result?.[0]?.count || 0
            });
          }
        }

        if (isMounted) {
          setData(prev => ({ ...prev, sessionTimeSeries }));
          setLoading(prev => ({ ...prev, sessionChart: false }));
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching session time series:', error);
          toast.error('Kunne ikke hente samtalestatistikk over tid');
          setLoading(prev => ({ ...prev, sessionChart: false }));
        }
      }
    };

    fetchSessionTimeSeries();

    return () => {
      isMounted = false;
    };
  }, [user?.organization_id, dateRange, timeRange]);

  // Fetch user time series data
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
        const daysDiff = differenceInDays(dateRange.to, dateRange.from);

        for (const frame of timeFrames) {
          if (daysDiff <= 30) {
            const startOfDay = new Date(frame.start);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(frame.start);
            endOfDay.setHours(23, 59, 59, 999);

            const userCount = conversations.filter((conv: any) => {
              const convDate = new Date(conv.updatedAt);
              return convDate >= startOfDay && convDate <= endOfDay;
            }).length;

            userTimeSeries.push({
              date: formatDateLabel(frame.start, daysDiff),
              value: userCount
            });
          } else {
            const userCount = conversations.filter((conv: any) => {
              const convDate = new Date(conv.updatedAt);
              return convDate >= frame.start && convDate <= frame.end;
            }).length;

            userTimeSeries.push({
              date: formatDateLabel(frame.start, daysDiff),
              value: userCount
            });
          }
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

  // Fetch top intents data
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchTopIntents = async () => {
      if (!user?.organization_id) return;

      setLoading(prev => ({ ...prev, intentChart: true }));

      try {
        // Fetch top intents data
        const { data: intentData, error: intentError } = await supabase.functions
          .invoke('get-voiceflow-analytics', {
            body: {
              startDate: dateRange.from.toISOString(),
              endDate: dateRange.to.toISOString(),
              queryType: 'top_intents'
            },
          });

        if (intentError) throw intentError;

        // Extract intents from the response and filter out VF prefixed ones
        const topIntents: IntentData[] = intentData?.result?.[0]?.intents || [];

        if (isMounted) {
          setData(prev => ({ ...prev, topIntents }));
          setLoading(prev => ({ ...prev, intentChart: false }));
        }
      } catch (error) {
        if (isMounted && !abortController.signal.aborted) {
          console.error('Error fetching top intents:', error);
          toast.error('Kunne ikke hente tema-statistikk');
          setLoading(prev => ({ ...prev, intentChart: false }));
        }
      }
    };

    fetchTopIntents();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [user?.organization_id, dateRange, timeRange]);

  // Fetch feedback and escalation metrics
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchFeedbackMetrics = async () => {
      if (!user?.organization_id) return;

      setLoading(prev => ({ 
        ...prev, 
        feedbackChart: true,
        escalationChart: true
      }));

      try {
        // Query the database directly for metrics
        const { data: metricsData, error: metricsError } = await supabase
          .from('conversation_metrics')
          .select('*')
          .eq('organization_id', user.organization_id)
          .gte('timestamp', dateRange.from.toISOString())
          .lte('timestamp', dateRange.to.toISOString());

        if (metricsError) throw metricsError;

        // Process metrics data
        const happyFaceCount = metricsData.filter(m => m.metric_type === 'happy_face').length;
        const neutralFaceCount = metricsData.filter(m => m.metric_type === 'neutral_face').length;
        const sadFaceCount = metricsData.filter(m => m.metric_type === 'sad_face').length;
        const escalatedCount = metricsData.filter(m => m.metric_type === 'escalated_to_human').length;

        // Process time series data
        const timeFrames = getTimeFrames(dateRange.from, dateRange.to);
        const feedbackTimeSeries: FeedbackTimeSeriesData[] = [];
        const escalationTimeSeries: TimeSeriesData[] = [];
      
        const daysDiff = differenceInDays(dateRange.to, dateRange.from);
      
        for (const frame of timeFrames) {
          const frameMetrics = metricsData.filter(m => {
            const date = new Date(m.timestamp);
            return date >= frame.start && date <= frame.end;
          });

          const happy = frameMetrics.filter(m => m.metric_type === 'happy_face').length;
          const neutral = frameMetrics.filter(m => m.metric_type === 'neutral_face').length;
          const sad = frameMetrics.filter(m => m.metric_type === 'sad_face').length;
          const escalated = frameMetrics.filter(m => m.metric_type === 'escalated_to_human').length;

          // Format the date for display
          const dateLabel = formatDateLabel(frame.start, daysDiff);
        
          feedbackTimeSeries.push({
            date: dateLabel,
            happy_face: happy,
            neutral_face: neutral,
            sad_face: sad
          });

          escalationTimeSeries.push({
            date: dateLabel,
            value: escalated
          });
        }

        // Log for debugging
        console.log('Feedback time series:', feedbackTimeSeries);

        if (isMounted) {
          setData(prev => ({
            ...prev,
            happyFaceCount,
            neutralFaceCount,
            sadFaceCount,
            escalatedCount,
            feedbackTimeSeries,
            escalationTimeSeries
          }));
        
          setLoading(prev => ({
            ...prev,
            feedbackChart: false,
            escalationChart: false
          }));
        }
      } catch (error) {
        if (isMounted && !abortController.signal.aborted) {
          console.error('Error fetching feedback metrics:', error);
          toast.error('Kunne ikke hente tilbakemeldingsdata');
          setLoading(prev => ({
            ...prev,
            feedbackChart: false,
            escalationChart: false
          }));
        }
      }
    };

    fetchFeedbackMetrics();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [user?.organization_id, dateRange, timeRange]);

  return { data, loading };
};
