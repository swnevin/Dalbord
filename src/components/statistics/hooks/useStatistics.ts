
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
        return { from: subMonths(today, 1), to: today };
      case '90d':
        return { from: subMonths(today, 3), to: today };
      case '365d':
        return { from: subYears(today, 1), to: today };
      case 'all':
        return null;
      case 'custom':
        return dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : null;
      default:
        return { from: subDays(today, 7), to: today };
    }
  };

  const fetchMetrics = useCallback(async () => {
    if (!user?.organization_id) return;

    setLoading(initialLoadingState);
    setError(null);

    const dates = getDatesForTimeRange(timeRange);
    const from = dates?.from ? startOfDay(dates.from).toISOString() : null;
    const to = dates?.to ? endOfDay(dates.to).toISOString() : null;

    try {
      // Use Supabase client to call the get-metrics function
      const { data: metrics, error: metricsError } = await supabase.functions.invoke('get-metrics', {
        body: {
          organization_id: user.organization_id,
          start_date: from,
          end_date: to,
        },
      });

      if (metricsError) {
        throw metricsError;
      }

      const processedData = processMetricsData(metrics);
      
      // Add some mock data for charts that aren't available in metrics
      const mockData = {
        totalMessages: 150,
        totalSessions: 45,
        totalConversations: 32,
        fallbackCount: 5,
        messageTimeSeries: generateMockTimeSeries('messages'),
        userTimeSeries: generateMockTimeSeries('users'),
        sessionTimeSeries: generateMockTimeSeries('sessions'),
        topIntents: [
          { name: 'Hjelp', count: 25 },
          { name: 'Priser', count: 18 },
          { name: 'Kontakt', count: 12 },
          { name: 'Produkter', count: 10 },
        ],
        timeSaved: 120,
        moneySaved: 15000,
      };

      setData({ ...processedData, ...mockData });

    } catch (error: any) {
      console.error("Error fetching metrics:", error);
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
  }, [user?.organization_id, timeRange, dateRange]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const refetch = () => {
    fetchMetrics();
  };

  return { data, loading, error, refetch, dateRange, setDateRange, timeRange, setTimeRange };
};

const processMetricsData = (metrics: MetricsResponse): StatisticsData => {
  const processedData: StatisticsData = {
    happyFaceCount: metrics.totals.happy_face || 0,
    neutralFaceCount: metrics.totals.neutral_face || 0,
    sadFaceCount: metrics.totals.sad_face || 0,
    escalatedCount: metrics.totals.escalated_to_human || 0,
    successfulAnswerCount: metrics.totals.successful_answer || 0,
    thumbsUpCount: metrics.totals.thumbs_up || 0,
    thumbsDownCount: metrics.totals.thumbs_down || 0,
  };

  // Process time series data for feedback charts
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
      fallback: 0 // We don't have fallback data in current metrics
    }));

    processedData.feedbackTimeSeries = feedbackTimeSeries;
    processedData.successVsFallbackTimeSeries = successVsFallbackTimeSeries;
  }

  return processedData;
};

// Helper function to generate mock time series data
const generateMockTimeSeries = (type: string) => {
  const dates = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    dates.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 50) + 10,
    });
  }
  
  return dates;
};
