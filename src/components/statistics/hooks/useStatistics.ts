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

// Default values for savings settings - updated to new standards
const DEFAULT_TIME_PER_MESSAGE = 3; // 3 minutes
const DEFAULT_HOURLY_RATE = 300; // 300 NOK/hour

// localStorage keys
const STORAGE_KEYS = {
  TIME_PER_MESSAGE: 'dalai_time_per_message',
  HOURLY_RATE: 'dalai_hourly_rate',
};

// Helper functions for localStorage
const loadFromStorage = (key: string, defaultValue: number): number => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = parseFloat(stored);
      return !isNaN(parsed) && parsed > 0 ? parsed : defaultValue;
    }
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
  }
  return defaultValue;
};

const saveToStorage = (key: string, value: number): void => {
  try {
    localStorage.setItem(key, value.toString());
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
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
  
  // Initialize from localStorage
  const [timePerMessage, setTimePerMessage] = useState<number>(() => 
    loadFromStorage(STORAGE_KEYS.TIME_PER_MESSAGE, DEFAULT_TIME_PER_MESSAGE)
  );
  const [hourlyRate, setHourlyRate] = useState<number>(() => 
    loadFromStorage(STORAGE_KEYS.HOURLY_RATE, DEFAULT_HOURLY_RATE)
  );
  
  const { user } = useAuth();

  const getDatesForTimeRange = (timeRange: TimeRange): { from: Date; to: Date } => {
    const today = new Date();
    console.log('Current date for range calculation:', today.toISOString());
    
    switch (timeRange) {
      case '7d':
        // Critical fix: Use startOfDay for consistent date handling and ensure 7 full days
        const todayStart = startOfDay(today);
        const from7d = startOfDay(subDays(todayStart, 6)); // 6 days back to include today = 7 total
        
        console.log('7d range calculation:', {
          today: today.toISOString(),
          todayStart: todayStart.toISOString(),
          from7d: from7d.toISOString(),
          fromDate: from7d.toISOString().split('T')[0],
          toDate: todayStart.toISOString().split('T')[0],
          totalDays: Math.ceil((todayStart.getTime() - from7d.getTime()) / (1000 * 60 * 60 * 24)) + 1
        });
        
        return { from: from7d, to: todayStart };
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
        return dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : { from: subDays(today, 6), to: today };
      default:
        return { from: subDays(today, 6), to: today };
    }
  };

  const updateSavingsSettings = useCallback((settings: { timePerMessage: number; hourlyRate: number }) => {
    // Update state
    setTimePerMessage(settings.timePerMessage);
    setHourlyRate(settings.hourlyRate);
    
    // Save to localStorage
    saveToStorage(STORAGE_KEYS.TIME_PER_MESSAGE, settings.timePerMessage);
    saveToStorage(STORAGE_KEYS.HOURLY_RATE, settings.hourlyRate);
    
    console.log('Savings settings updated and saved:', settings);
  }, []);

  const fetchVoiceflowData = useCallback(async (startDate: string, endDate: string) => {
    try {
      console.log('Fetching Voiceflow analytics...');
      
      // Fetch interactions (messages) totals
      const { data: interactionsData, error: interactionsError } = await supabase.functions.invoke('get-voiceflow-analytics', {
        body: {
          startDate,
          endDate,
          queryType: 'interactions'
        },
      });

      if (interactionsError) throw interactionsError;

      // Fetch sessions totals
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

  const fetchDailyVoiceflowData = useCallback(async (startDate: string, endDate: string) => {
    try {
      console.log('Fetching daily Voiceflow data with precise date range:', {
        startDate,
        endDate,
        startDateParsed: new Date(startDate).toISOString(),
        endDateParsed: new Date(endDate).toISOString()
      });

      // Fetch daily interactions
      const { data: dailyInteractionsData, error: dailyInteractionsError } = await supabase.functions.invoke('get-voiceflow-analytics', {
        body: {
          startDate,
          endDate,
          queryType: 'daily_interactions'
        },
      });

      if (dailyInteractionsError) throw dailyInteractionsError;

      // Fetch daily sessions
      const { data: dailySessionsData, error: dailySessionsError } = await supabase.functions.invoke('get-voiceflow-analytics', {
        body: {
          startDate,
          endDate,
          queryType: 'daily_sessions'
        },
      });

      if (dailySessionsError) throw dailySessionsError;

      console.log('Daily Voiceflow data received:', { 
        dailyInteractionsData, 
        dailySessionsData,
        interactionsDays: dailyInteractionsData?.dailyData?.length,
        sessionsDays: dailySessionsData?.dailyData?.length
      });

      return {
        dailyInteractions: dailyInteractionsData,
        dailySessions: dailySessionsData
      };
    } catch (error) {
      console.error('Error fetching daily Voiceflow data:', error);
      throw error;
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    if (!user?.organization_id) return;

    setLoading(initialLoadingState);
    setError(null);

    const dates = getDatesForTimeRange(timeRange);
    // Use endOfDay for the 'to' date to ensure we capture the full day
    const from = startOfDay(dates.from).toISOString();
    const to = endOfDay(dates.to).toISOString();

    try {
      console.log('Fetching data for organization:', user.organization_id);
      console.log('CRITICAL - Date range being sent to functions:', { 
        from, 
        to, 
        timeRange,
        fromDate: dates.from.toISOString().split('T')[0],
        toDate: dates.to.toISOString().split('T')[0],
        expectedDays: timeRange === '7d' ? 7 : 'variable'
      });
      
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
      let dailyVoiceflowData = null;
      
      try {
        // Fetch both total and daily Voiceflow data
        [voiceflowData, dailyVoiceflowData] = await Promise.all([
          fetchVoiceflowData(from, to),
          fetchDailyVoiceflowData(from, to)
        ]);
      } catch (vfError) {
        console.warn('Voiceflow data fetch failed, continuing with metrics only:', vfError);
      }

      console.log('All data received:', { metrics, voiceflowData, dailyVoiceflowData });
      const processedData = processAllData(metrics, voiceflowData, dailyVoiceflowData, timePerMessage, hourlyRate);
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
  }, [user?.organization_id, timeRange, dateRange, fetchVoiceflowData, fetchDailyVoiceflowData, timePerMessage, hourlyRate]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const refetch = () => {
    fetchMetrics();
  };

  return { 
    data, 
    loading, 
    error, 
    refetch, 
    dateRange, 
    setDateRange, 
    timeRange, 
    setTimeRange,
    timePerMessage,
    hourlyRate,
    updateSavingsSettings
  };
};

const processAllData = (metrics: MetricsResponse, voiceflowData: any, dailyVoiceflowData: any, timePerMessage: number, hourlyRate: number): StatisticsData => {
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

  // Process Voiceflow totals for cards (existing logic)
  if (voiceflowData) {
    // Process interactions (messages) totals
    if (voiceflowData.interactions?.result?.length > 0) {
      processedData.totalMessages = voiceflowData.interactions.result[0].count || 0;
    }

    // Process sessions totals
    if (voiceflowData.sessions?.result?.length > 0) {
      processedData.totalSessions = voiceflowData.sessions.result[0].count || 0;
    }

    // Process top intents totals
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

    // Calculate time and money saved based on total messages
    if (processedData.totalMessages && processedData.totalMessages > 0) {
      // Calculate time saved in minutes
      const timeSavedMinutes = processedData.totalMessages * timePerMessage;
      processedData.timeSaved = timeSavedMinutes;
      
      // Calculate money saved based on time saved and hourly rate
      const timeSavedHours = timeSavedMinutes / 60;
      processedData.moneySaved = timeSavedHours * hourlyRate;
    } else {
      processedData.timeSaved = 0;
      processedData.moneySaved = 0;
    }
  }

  // Process daily Voiceflow data for graphs (new logic)
  if (dailyVoiceflowData) {
    // Process daily interactions for message time series
    if (dailyVoiceflowData.dailyInteractions?.dailyData) {
      processedData.messageTimeSeries = dailyVoiceflowData.dailyInteractions.dailyData.map((item: any) => ({
        date: item.date,
        value: item.count || 0
      }));
      console.log('Message time series:', processedData.messageTimeSeries);
    }

    // Process daily sessions for session time series
    if (dailyVoiceflowData.dailySessions?.dailyData) {
      processedData.sessionTimeSeries = dailyVoiceflowData.dailySessions.dailyData.map((item: any) => ({
        date: item.date,
        value: item.count || 0
      }));
      console.log('Session time series:', processedData.sessionTimeSeries);
    }
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
