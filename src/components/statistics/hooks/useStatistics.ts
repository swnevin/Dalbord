
import { useState, useEffect, useCallback } from "react";
import { format, parse, subDays } from "date-fns";
import { nb } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { DateRange, TimeRange, SavingsSettings, TimeSeriesDataPoint, ChartDataPoint } from "../types";

interface StatisticsData {
  // Summary metrics
  totalMessages: number | null;
  totalSessions: number | null;
  totalConversations: number | null;
  escalatedCount: number | null;
  thumbsUpCount: number | null;
  thumbsDownCount: number | null;
  successfulAnswerCount: number | null;
  fallbackCount: number | null;
  timeSaved: number | null;
  moneySaved: number | null;

  // Time series data
  userTimeSeries: TimeSeriesDataPoint[];
  sessionTimeSeries: TimeSeriesDataPoint[];
  messageTimeSeries: TimeSeriesDataPoint[];
  topIntents: ChartDataPoint[];
  
  // For any other calculated metrics
  successVsFallbackTimeSeries: TimeSeriesDataPoint[];
  timeRange: DateRange;
}

interface LoadingState {
  summaryCards: boolean;
  feedbackChart: boolean;
  fallbackChart: boolean;
  userChart: boolean;
  sessionChart: boolean;
  messageChart: boolean;
  intentChart: boolean;
}

export const useStatistics = (
  dateRange: DateRange, 
  timeRange: TimeRange,
  savingsSettings: SavingsSettings,
  organizationId?: string
) => {
  const [data, setData] = useState<StatisticsData>({
    // Initialize with null or empty values
    totalMessages: null,
    totalSessions: null,
    totalConversations: null,
    escalatedCount: null,
    thumbsUpCount: null,
    thumbsDownCount: null,
    successfulAnswerCount: null,
    fallbackCount: null,
    timeSaved: null,
    moneySaved: null,
    userTimeSeries: [],
    sessionTimeSeries: [],
    messageTimeSeries: [],
    topIntents: [],
    successVsFallbackTimeSeries: [],
    timeRange: dateRange
  });

  const [loading, setLoading] = useState<LoadingState>({
    summaryCards: true,
    feedbackChart: true,
    fallbackChart: true,
    userChart: true,
    sessionChart: true,
    messageChart: true,
    intentChart: true
  });

  // Helper to set loading state for a specific component
  const setComponentLoading = (component: keyof LoadingState, isLoading: boolean) => {
    setLoading(prev => ({
      ...prev,
      [component]: isLoading
    }));
  };

  // Format date for display
  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "dd.MM", { locale: nb });
  };

  // Generate success vs fallback time series
  const generateSuccessVsFallbackTimeSeries = useCallback(() => {
    // Generate sample dates from date range
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const result: TimeSeriesDataPoint[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(dateRange.start);
      date.setDate(date.getDate() + i);
      
      result.push({
        date: formatDateForDisplay(date.toISOString()),
        successful_answer: 0,
        fallback: 0
      });
    }

    console.info("Success vs Fallback time series:", result);
    return result;
  }, [dateRange]);

  // Fetch summary data (messages, sessions, conversations)
  const fetchSummaryData = useCallback(async () => {
    if (!organizationId) return;
    
    setComponentLoading('summaryCards', true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke('get-voiceflow-analytics', {
        body: {
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
          queryType: 'summary',
          organizationId
        }
      });

      if (error) throw error;

      const summaryData = response?.data?.[0]?.summary || {
        total_messages: 0,
        total_sessions: 0,
        total_conversations: 0
      };

      setData(prev => ({
        ...prev,
        totalMessages: summaryData.total_messages || 0,
        totalSessions: summaryData.total_sessions || 0,
        totalConversations: summaryData.total_conversations || 0,
        // Calculate savings based on total messages
        timeSaved: (summaryData.total_messages || 0) * savingsSettings.timePerMessage,
        moneySaved: (summaryData.total_messages || 0) * savingsSettings.timePerMessage * (savingsSettings.hourlyRate / 60)
      }));
    } catch (error) {
      console.error('Error fetching summary statistics:', error);
      // Set to 0 on error for better UX than null
      setData(prev => ({
        ...prev,
        totalMessages: 0,
        totalSessions: 0,
        totalConversations: 0,
        timeSaved: 0,
        moneySaved: 0
      }));
    } finally {
      setComponentLoading('summaryCards', false);
    }
  }, [dateRange, savingsSettings, organizationId]);

  // Fetch feedback metrics
  const fetchFeedbackMetrics = useCallback(async () => {
    if (!organizationId) return;
    
    setComponentLoading('feedbackChart', true);
    
    try {
      const { data: metrics, error } = await supabase.functions.invoke('get-metrics', {
        body: {
          organization_id: organizationId,
          start_date: dateRange.start.toISOString(),
          end_date: dateRange.end.toISOString(),
          metrics: ['thumbs_up', 'thumbs_down', 'escalated_to_human']
        }
      });

      if (error) throw error;

      const totals = metrics?.totals || {
        thumbs_up: 0,
        thumbs_down: 0,
        escalated_to_human: 0
      };

      setData(prev => ({
        ...prev,
        thumbsUpCount: totals.thumbs_up || 0,
        thumbsDownCount: totals.thumbs_down || 0,
        escalatedCount: totals.escalated_to_human || 0
      }));
    } catch (error) {
      console.error('Error fetching feedback metrics:', error);
      setData(prev => ({
        ...prev,
        thumbsUpCount: 0,
        thumbsDownCount: 0,
        escalatedCount: 0
      }));
    } finally {
      setComponentLoading('feedbackChart', false);
    }
  }, [dateRange, organizationId]);

  // Fetch fallback metrics
  const fetchFallbackMetrics = useCallback(async () => {
    if (!organizationId) return;
    
    setComponentLoading('fallbackChart', true);
    
    try {
      const { data: metrics, error } = await supabase.functions.invoke('get-metrics', {
        body: {
          organization_id: organizationId,
          start_date: dateRange.start.toISOString(),
          end_date: dateRange.end.toISOString(),
          metrics: ['successful_answer', 'fallback']
        }
      });

      if (error) throw error;

      const totals = metrics?.totals || {
        successful_answer: 0,
        fallback: 0
      };

      setData(prev => ({
        ...prev,
        successfulAnswerCount: totals.successful_answer || 0,
        fallbackCount: totals.fallback || 0,
        successVsFallbackTimeSeries: generateSuccessVsFallbackTimeSeries()
      }));
    } catch (error) {
      console.error('Error fetching fallback metrics:', error);
      setData(prev => ({
        ...prev,
        successfulAnswerCount: 0,
        fallbackCount: 0,
        successVsFallbackTimeSeries: generateSuccessVsFallbackTimeSeries()
      }));
    } finally {
      setComponentLoading('fallbackChart', false);
    }
  }, [dateRange, generateSuccessVsFallbackTimeSeries, organizationId]);

  // Fetch message time series
  const fetchMessageTimeSeries = useCallback(async () => {
    if (!organizationId) return;
    
    setComponentLoading('messageChart', true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke('get-voiceflow-analytics', {
        body: {
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
          queryType: 'interactions',
          organizationId
        }
      });

      if (error) throw error;

      // Process the data for the chart
      const messageData = response?.data?.[0]?.interactions || [];
      
      // Group by day and count
      const dataByDay: { [key: string]: number } = {};
      
      messageData.forEach((item: any) => {
        const date = new Date(item.date);
        const day = format(date, "dd.MM", { locale: nb });
        
        if (!dataByDay[day]) {
          dataByDay[day] = 0;
        }
        
        dataByDay[day] += item.count || 1;
      });
      
      // Convert to array format for the chart
      const timeSeries: TimeSeriesDataPoint[] = Object.keys(dataByDay).map(day => ({
        date: day,
        value: dataByDay[day]
      }));
      
      // Sort by date
      timeSeries.sort((a, b) => {
        const dateA = parse(`${a.date}.${new Date().getFullYear()}`, "dd.MM.yyyy", new Date());
        const dateB = parse(`${b.date}.${new Date().getFullYear()}`, "dd.MM.yyyy", new Date());
        return dateA.getTime() - dateB.getTime();
      });

      setData(prev => ({ ...prev, messageTimeSeries: timeSeries }));
    } catch (error) {
      console.error('Error fetching message time series:', error);
      setData(prev => ({ ...prev, messageTimeSeries: [] }));
    } finally {
      setComponentLoading('messageChart', false);
    }
  }, [dateRange, organizationId]);

  // Fetch session time series
  const fetchSessionTimeSeries = useCallback(async () => {
    if (!organizationId) return;
    
    setComponentLoading('sessionChart', true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke('get-voiceflow-analytics', {
        body: {
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
          queryType: 'sessions',
          organizationId
        }
      });

      if (error) throw error;

      // Process the data for the chart
      const sessionData = response?.data?.[0]?.sessions || [];
      
      // Group by day and count
      const dataByDay: { [key: string]: number } = {};
      
      sessionData.forEach((item: any) => {
        const date = new Date(item.date);
        const day = format(date, "dd.MM", { locale: nb });
        
        if (!dataByDay[day]) {
          dataByDay[day] = 0;
        }
        
        dataByDay[day] += item.count || 1;
      });
      
      // Convert to array format for the chart
      const timeSeries: TimeSeriesDataPoint[] = Object.keys(dataByDay).map(day => ({
        date: day,
        value: dataByDay[day]
      }));
      
      // Sort by date
      timeSeries.sort((a, b) => {
        const dateA = parse(`${a.date}.${new Date().getFullYear()}`, "dd.MM.yyyy", new Date());
        const dateB = parse(`${b.date}.${new Date().getFullYear()}`, "dd.MM.yyyy", new Date());
        return dateA.getTime() - dateB.getTime();
      });

      setData(prev => ({ ...prev, sessionTimeSeries: timeSeries }));
    } catch (error) {
      console.error('Error fetching session time series:', error);
      setData(prev => ({ ...prev, sessionTimeSeries: [] }));
    } finally {
      setComponentLoading('sessionChart', false);
    }
  }, [dateRange, organizationId]);

  // Fetch user time series
  const fetchUserTimeSeries = useCallback(async () => {
    if (!organizationId) return;
    
    setComponentLoading('userChart', true);
    
    try {
      // For user time series, we'll use conversation data
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key, voiceflow_project_id')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;
      if (!org.voiceflow_api_key || !org.voiceflow_project_id) {
        throw new Error('Missing Voiceflow credentials');
      }

      const response = await fetch(
        `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: org.voiceflow_api_key,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch conversations');

      const conversations = await response.json();
      
      // Group by day
      const usersByDay: { [key: string]: Set<string> } = {};
      
      conversations.forEach((conv: any) => {
        const date = new Date(conv.updatedAt);
        const day = format(date, "dd.MM", { locale: nb });
        
        if (!usersByDay[day]) {
          usersByDay[day] = new Set();
        }
        
        // Use session ID or user name/ID as unique identifier
        const userId = conv.user?.name || conv.sessionID || 'anonymous';
        usersByDay[day].add(userId);
      });
      
      // Convert to array format for the chart
      const timeSeries: TimeSeriesDataPoint[] = Object.keys(usersByDay).map(day => ({
        date: day,
        value: usersByDay[day].size
      }));
      
      // Sort by date
      timeSeries.sort((a, b) => {
        const dateA = parse(`${a.date}.${new Date().getFullYear()}`, "dd.MM.yyyy", new Date());
        const dateB = parse(`${b.date}.${new Date().getFullYear()}`, "dd.MM.yyyy", new Date());
        return dateA.getTime() - dateB.getTime();
      });

      setData(prev => ({ ...prev, userTimeSeries: timeSeries }));
    } catch (error) {
      console.error('Error fetching user time series:', error);
      setData(prev => ({ ...prev, userTimeSeries: [] }));
    } finally {
      setComponentLoading('userChart', false);
    }
  }, [dateRange, organizationId]);

  // Fetch top intents
  const fetchTopIntents = useCallback(async () => {
    if (!organizationId) return;
    
    setComponentLoading('intentChart', true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke('get-voiceflow-analytics', {
        body: {
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
          queryType: 'top_intents',
          organizationId
        }
      });

      if (error) throw error;

      const intentData = response?.data?.[0]?.top_intents || [];
      
      // Convert to chart data format
      const topIntents: ChartDataPoint[] = intentData.map((item: any) => ({
        name: item.intent || 'Ukjent',
        value: item.count || 0
      }));
      
      // Sort by count descending
      topIntents.sort((a, b) => b.value - a.value);

      setData(prev => ({ ...prev, topIntents }));
    } catch (error) {
      console.error('Error fetching top intents:', error);
      setData(prev => ({ ...prev, topIntents: [] }));
    } finally {
      setComponentLoading('intentChart', false);
    }
  }, [dateRange, organizationId]);

  // Fetch all data when dependencies change
  useEffect(() => {
    if (organizationId) {
      fetchSummaryData();
      fetchFeedbackMetrics();
      fetchFallbackMetrics();
      fetchMessageTimeSeries();
      fetchSessionTimeSeries();
      fetchUserTimeSeries();
      fetchTopIntents();
    }
  }, [
    fetchSummaryData,
    fetchFeedbackMetrics,
    fetchFallbackMetrics,
    fetchMessageTimeSeries,
    fetchSessionTimeSeries,
    fetchUserTimeSeries,
    fetchTopIntents,
    organizationId
  ]);

  // Update savings calculations when settings or total messages change
  useEffect(() => {
    if (data.totalMessages !== null) {
      setData(prev => ({
        ...prev,
        timeSaved: prev.totalMessages! * savingsSettings.timePerMessage,
        moneySaved: prev.totalMessages! * savingsSettings.timePerMessage * (savingsSettings.hourlyRate / 60)
      }));
    }
  }, [savingsSettings, data.totalMessages]);

  return { data, loading };
};
