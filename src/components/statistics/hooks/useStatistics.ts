
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

  const getDatesForTimeRange = (timeRange: TimeRange): { from: Date; to: Date } => {
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
        // For 'all', use a very old date instead of null
        return { from: new Date('2020-01-01'), to: today };
      case 'custom':
        return dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : { from: subDays(today, 7), to: today };
      default:
        return { from: subDays(today, 7), to: today };
    }
  };

  const fetchVoiceflowData = useCallback(async (startDate: string, endDate: string) => {
    try {
      console.log('Fetching Voiceflow analytics with combined query...');
      
      // Fetch combined interactions and sessions data
      const { data: combinedData, error: combinedError } = await supabase.functions.invoke('get-voiceflow-analytics', {
        body: {
          startDate,
          endDate,
          queryType: 'combined'
        },
      });

      if (combinedError) throw combinedError;

      console.log('Combined Voiceflow data received:', combinedData);

      return {
        combined: combinedData
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
    const from = startOfDay(dates.from).toISOString();
    const to = endOfDay(dates.to).toISOString();

    try {
      console.log('Fetching data for organization:', user.organization_id);
      console.log('Date range being sent:', { from, to, timeRange });
      
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

      console.log('Metrics response received:', metrics);

      let voiceflowData = null;
      try {
        voiceflowData = await fetchVoiceflowData(from, to);
      } catch (vfError) {
        console.warn('Voiceflow data fetch failed, continuing with metrics only:', vfError);
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
  if (voiceflowData?.combined) {
    console.log('Processing combined Voiceflow data:', voiceflowData.combined);

    // The response should contain results for both interactions and sessions
    if (voiceflowData.combined.result && Array.isArray(voiceflowData.combined.result)) {
      voiceflowData.combined.result.forEach((queryResult: any) => {
        if (queryResult.name === 'interactions') {
          // Process interactions - could be total count or time series
          if (Array.isArray(queryResult.data)) {
            // Time series data
            processedData.messageTimeSeries = queryResult.data.map((item: any) => ({
              date: item.date || item.timestamp,
              value: item.count || 0
            }));
            // Total is sum of all daily values
            processedData.totalMessages = queryResult.data.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
          } else if (queryResult.count !== undefined) {
            // Total count only
            processedData.totalMessages = queryResult.count;
          }
        } else if (queryResult.name === 'sessions') {
          // Process sessions - could be total count or time series
          if (Array.isArray(queryResult.data)) {
            // Time series data
            processedData.sessionTimeSeries = queryResult.data.map((item: any) => ({
              date: item.date || item.timestamp,
              value: item.count || 0
            }));
            // Total is sum of all daily values
            processedData.totalSessions = queryResult.data.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
          } else if (queryResult.count !== undefined) {
            // Total count only
            processedData.totalSessions = queryResult.count;
          }
        }
      });
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
