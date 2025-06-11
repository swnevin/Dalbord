import { useState, useEffect, useCallback } from "react";
import { subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns';
import { StatisticsData, LoadingState, DateRange, TimeRange, MetricsResponse } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const initialLoadingState: LoadingState = {
  summaryCards: true,
  messageChart: true,
  userChart: true,
  sessionChart: true,
  intentChart: true,
  feedbackChart: true,
  escalationChart: true,
  fallbackChart: true,
};

export const useStatistics = () => {
  const [data, setData] = useState<StatisticsData>({});
  const [loading, setLoading] = useState<LoadingState>(initialLoadingState);
  const [error, setError] = useState<Error | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const { user } = useAuth();

  const getDatesForTimeRange = (timeRange: TimeRange): { from: Date; to: Date } | null => {
    const today = new Date();
    switch (timeRange) {
      case '7d':
        return { from: subDays(today, 7), to: today };
      case '30d':
        return { from: subDays(today, 30), to: today };
      case '90d':
        return { from: subDays(today, 90), to: today };
      case '365d':
        return { from: subDays(today, 365), to: today };
      case 'all':
        return null;
      case 'custom':
        return dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : null;
      default:
        return { from: subDays(today, 7), to: today };
    }
  };

  const fetchVoiceflowData = useCallback(async (startDate: string, endDate: string) => {
    try {
      console.log('Fetching Voiceflow analytics...');
      
      // Fetch interactions (messages)
      const { data: interactionsData, error: interactionsError } = await supabase.functions.invoke('get-voiceflow-analytics', {
        body: {
          startDate,
          endDate,
          queryType: 'interactions'
        },
      });

      if (interactionsError) throw interactionsError;

      // Fetch sessions 
      const { data: sessionsData, error: sessionsError } = await supabase.functions.invoke('get-voiceflow-analytics', {
        body: {
          startDate,
          endDate,
          queryType: 'sessions'
        },
      });

      if (sessionsError) throw sessionsError;

      // Fetch top intents
      const { data: intentsData, error: intentsError } = await supabase.functions.invoke('get-voiceflow-analytics', {
        body: {
          startDate,
          endDate,
          queryType: 'top_intents'
        },
      });

      if (intentsError) throw intentsError;

      console.log('Voiceflow data received:', { interactionsData, sessionsData, intentsData });

      return {
        interactions: interactionsData,
        sessions: sessionsData,
        intents: intentsData
      };
    } catch (error) {
      console.error('Error fetching Voiceflow data:', error);
      throw error;
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    if (!user?.organization_id) return;

    setLoading(initialLoadingState);
    setError(null);

    const dates = getDatesForTimeRange(timeRange);
    const from = dates?.from ? startOfDay(dates.from).toISOString() : null;
    const to = dates?.to ? endOfDay(dates.to).toISOString() : null;

    try {
      console.log('Fetching data for organization:', user.organization_id);
      
      // Fetch metrics from database
      const { data: metrics, error: metricsError } = await supabase.functions.invoke('get-metrics', {
        body: {
          organization_id: user.organization_id,
          start_date: from,
          end_date: to,
        },
      });

      if (metricsError) {
        console.error('Metrics error:', metricsError);
        throw metricsError;
      }

      let voiceflowData = null;
      if (from && to) {
        try {
          voiceflowData = await fetchVoiceflowData(from, to);
        } catch (vfError) {
          console.warn('Voiceflow data fetch failed, continuing with metrics only:', vfError);
        }
      }

      console.log('All data received:', { metrics, voiceflowData });
      const processedData = processAllData(metrics, voiceflowData);
      setData(processedData);

    } catch (error: any) {
      console.error("Error fetching data:", error);
      setError(error);
    } finally {
      setLoading({
        summaryCards: false,
        messageChart: false,
        userChart: false,
        sessionChart: false,
        intentChart: false,
        feedbackChart: false,
        escalationChart: false,
        fallbackChart: false,
      });
    }
  }, [user?.organization_id, timeRange, dateRange, fetchVoiceflowData]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const refetch = () => {
    fetchMetrics();
  };

  return { data, loading, error, refetch, dateRange, setDateRange, timeRange, setTimeRange };
};

const processAllData = (metrics: MetricsResponse, voiceflowData: any): StatisticsData => {
  const processedData: StatisticsData = {
    // Metrics from database
    happyFaceCount: metrics.totals.happy_face,
    neutralFaceCount: metrics.totals.neutral_face,
    sadFaceCount: metrics.totals.sad_face,
    escalatedCount: metrics.totals.escalated_to_human,
    successfulAnswerCount: metrics.totals.successful_answer,
    thumbsUpCount: metrics.totals.thumbs_up,
    thumbsDownCount: metrics.totals.thumbs_down,
    // Add fallback count from the new data structure
    fallbackCount: metrics.totals.fallback || 0,
  };

  // Process Voiceflow data if available
  if (voiceflowData) {
    // Process interactions (messages) - fix the data structure path
    if (voiceflowData.interactions?.result?.length > 0) {
      processedData.totalMessages = voiceflowData.interactions.result[0].count || 0;
    }

    // Process sessions - fix the data structure path
    if (voiceflowData.sessions?.result?.length > 0) {
      processedData.totalSessions = voiceflowData.sessions.result[0].count || 0;
    }

    // Process top intents - fix the data structure path
    if (voiceflowData.intents?.result?.length > 0) {
      const intentsResult = voiceflowData.intents.result[0];
      if (intentsResult.intents && Array.isArray(intentsResult.intents)) {
        processedData.topIntents = intentsResult.intents.map((item: any) => ({
          name: item.name,
          count: item.count || 0
        }));
      }
    }

    // Set totalConversations same as totalSessions for now
    processedData.totalConversations = processedData.totalSessions;
  }

  // Process time series data for feedback charts from metrics
  if (metrics.timeSeries && metrics.timeSeries.length > 0) {
    const feedbackTimeSeries = metrics.timeSeries.map(item => ({
      date: item.date,
      happy_face: item.happy_face || 0,
      neutral_face: item.neutral_face || 0,
      sad_face: item.sad_face || 0
    }));

    const successVsFallbackTimeSeries = metrics.timeSeries.map(item => ({
      date: item.date,
      successful_answer: item.successful_answer || 0,
      fallback: item.fallback || 0
    }));

    processedData.feedbackTimeSeries = feedbackTimeSeries;
    processedData.successVsFallbackTimeSeries = successVsFallbackTimeSeries;
  }

  return processedData;
};
