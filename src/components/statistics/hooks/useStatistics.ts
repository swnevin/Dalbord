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

  const fetchStatistics = useCallback(async () => {
    if (!user?.organization_id) return;

    setLoading(initialLoadingState);
    setError(null);

    const dates = getDatesForTimeRange(timeRange);
    const from = dates?.from ? startOfDay(dates.from).toISOString() : null;
    const to = dates?.to ? endOfDay(dates.to).toISOString() : null;

    try {
      // Fetch statistics data from Supabase function
      const { data: statistics, error: statisticsError } = await supabase.functions.invoke('statistics', {
        body: {
          organizationId: user.organization_id,
          from,
          to,
        },
      });

      if (statisticsError) {
        throw statisticsError;
      }

      setData(statistics);
    } catch (error: any) {
      console.error("Error fetching statistics:", error);
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

  const fetchMetrics = useCallback(async () => {
    if (!user?.organization_id) return;

    setLoading(initialLoadingState);
    setError(null);

    const dates = getDatesForTimeRange(timeRange);
    const from = dates?.from ? startOfDay(dates.from).toISOString() : null;
    const to = dates?.to ? endOfDay(dates.to).toISOString() : null;

    try {
      let url = `${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/metrics?organization_id=${user.organization_id}`;
      if (from) url += `&from=${from}`;
      if (to) url += `&to=${to}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status} ${response.statusText}`);
      }

      const metrics: MetricsResponse = await response.json();
      const processedData = processMetricsData(metrics);
      setData(prevData => ({ ...prevData, ...processedData }));

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
    fetchStatistics();
    fetchMetrics();
  }, [fetchStatistics, fetchMetrics]);

  const refetch = () => {
    fetchStatistics();
    fetchMetrics();
  };

  return { data, loading, error, refetch, dateRange, setDateRange, timeRange, setTimeRange };
};

const processMetricsData = (metrics: MetricsResponse): StatisticsData => {
  const processedData: StatisticsData = {
    happyFaceCount: metrics.totals.happy_face,
    neutralFaceCount: metrics.totals.neutral_face,
    sadFaceCount: metrics.totals.sad_face,
    escalatedCount: metrics.totals.escalated_to_human,
    successfulAnswerCount: metrics.totals.successful_answer,
    thumbsUpCount: metrics.totals.thumbs_up,
    thumbsDownCount: metrics.totals.thumbs_down,
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
      fallback: metrics.rawMetrics.filter(m => 
        m.timestamp.startsWith(item.date) && 
        m.metric_type !== 'happy_face' && 
        m.metric_type !== 'neutral_face' && 
        m.metric_type !== 'sad_face' && 
        m.metric_type !== 'escalated_to_human' && 
        m.metric_type !== 'successful_answer' && 
        m.metric_type !== 'thumbs_up' && 
        m.metric_type !== 'thumbs_down'
      ).length
    }));

    processedData.feedbackTimeSeries = feedbackTimeSeries;
    processedData.successVsFallbackTimeSeries = successVsFallbackTimeSeries;
  }

  return processedData;
};
