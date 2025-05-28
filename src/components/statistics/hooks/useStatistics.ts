import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StatisticsData, LoadingState, MetricsResponse, DateRange, TimeRange } from "../types";
import { addDays, format, startOfDay, endOfDay } from "date-fns";

export const useStatistics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StatisticsData>({
    totalMessages: 0,
    totalConversations: 0,
    totalSessions: 0,
    happyFaceCount: 0,
    neutralFaceCount: 0,
    sadFaceCount: 0,
    escalatedCount: 0,
    successfulAnswerCount: 0,
    fallbackCount: 0,
    thumbsUpCount: 0,
    thumbsDownCount: 0,
  });
  const [loading, setLoading] = useState<LoadingState>({
    summaryCards: true,
    messageChart: true,
    userChart: true,
    sessionChart: true,
    intentChart: true,
    feedbackChart: true,
    escalationChart: true,
    fallbackChart: true
  });
  const [error, setError] = useState<Error | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const refetch = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [user?.organization_id, dateRange, timeRange]);

  const fetchData = async () => {
    if (!user?.organization_id) return;

    setLoading({
      summaryCards: true,
      messageChart: true,
      userChart: true,
      sessionChart: true,
      intentChart: true,
      feedbackChart: true,
      escalationChart: true,
      fallbackChart: true
    });
    setError(null);

    try {
      const [analyticsData, supabaseMetrics] = await Promise.all([
        fetchAnalyticsData(user.organization_id, dateRange),
        fetchSupabaseMetrics(user.organization_id, dateRange.from, dateRange.to)
      ]);

      setData(prevData => ({
        ...prevData,
        totalMessages: analyticsData.totalMessages,
        totalConversations: analyticsData.totalConversations,
        totalSessions: analyticsData.totalSessions,
        messageTimeSeries: analyticsData.messageTimeSeries,
        userTimeSeries: analyticsData.userTimeSeries,
        sessionTimeSeries: analyticsData.sessionTimeSeries,
        topIntents: analyticsData.topIntents,
        timeSaved: analyticsData.timeSaved,
        moneySaved: analyticsData.moneySaved,
        happyFaceCount: supabaseMetrics.totals.happy_face || 0,
        neutralFaceCount: supabaseMetrics.totals.neutral_face || 0,
        sadFaceCount: supabaseMetrics.totals.sad_face || 0,
        escalatedCount: supabaseMetrics.totals.escalated_to_human || 0,
        successfulAnswerCount: supabaseMetrics.totals.successful_answer || 0,
        thumbsUpCount: supabaseMetrics.totals.thumbs_up || 0,
        thumbsDownCount: supabaseMetrics.totals.thumbs_down || 0,
        feedbackTimeSeries: supabaseMetrics.timeSeries.map(item => ({
          date: item.date,
          happy_face: item.happy_face,
          neutral_face: item.neutral_face,
          sad_face: item.sad_face,
        })),
        escalationTimeSeries: supabaseMetrics.timeSeries.map(item => ({
          date: item.date,
          value: item.escalated_to_human,
        })),
        successVsFallbackTimeSeries: supabaseMetrics.timeSeries.map(item => ({
          date: item.date,
          successful_answer: item.successful_answer,
          fallback: 0, // Assuming fallback data is not directly available
        })),
      }));
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(prevLoading => ({
        ...prevLoading,
        summaryCards: false,
        messageChart: false,
        userChart: false,
        sessionChart: false,
        intentChart: false,
        feedbackChart: false,
        escalationChart: false,
        fallbackChart: false
      }));
    }
  };

  const fetchAnalyticsData = async (organizationId: string, dateRange: DateRange): Promise<StatisticsData> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const fromDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : null;
    const toDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : null;

    let url = `${baseUrl}/organizations/${organizationId}/analytics?`;
    if (fromDate) url += `from=${fromDate}&`;
    if (toDate) url += `to=${toDate}&`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      throw error;
    }
  };

  const fetchSupabaseMetrics = async (organizationId: string, startDate?: Date, endDate?: Date) => {
    try {
      let query = supabase
        .from('conversation_metrics')
        .select('*')
        .eq('organization_id', organizationId);

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('timestamp', endDate.toISOString());
      }

      const { data: metrics, error } = await query.order('timestamp', { ascending: true });

      if (error) throw error;

      const validMetrics = metrics?.filter(metric => 
        metric.metric_type !== 'add_to_cart'
      ) || [];

      const totals = validMetrics.reduce((acc: any, metric) => {
        acc[metric.metric_type] = (acc[metric.metric_type] || 0) + 1;
        return acc;
      }, {});

      const timeSeriesData: { [date: string]: any } = {};

      validMetrics.forEach(metric => {
        const date = format(new Date(metric.timestamp), 'yyyy-MM-dd');
        if (!timeSeriesData[date]) {
          timeSeriesData[date] = {};
        }
        timeSeriesData[date][metric.metric_type] = (timeSeriesData[date][metric.metric_type] || 0) + 1;
      });

      const timeSeries = Object.entries(timeSeriesData).map(([date, values]: [string, any]) => ({
        date,
        ...values,
      }));

      return {
        totals,
        timeSeries,
        rawMetrics: validMetrics
      };
    } catch (error) {
      console.error('Error fetching Supabase metrics:', error);
      return {
        totals: {},
        timeSeries: [],
        rawMetrics: []
      };
    }
  };

  return {
    data,
    loading,
    error,
    refetch,
    dateRange,
    setDateRange,
    timeRange,
    setTimeRange
  };
};
