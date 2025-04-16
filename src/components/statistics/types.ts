
export interface StatisticsData {
  totalMessages?: number;
  totalConversations?: number;
  totalSessions?: number;
  messageTimeSeries?: TimeSeriesData[];
  userTimeSeries?: TimeSeriesData[];
  sessionTimeSeries?: TimeSeriesData[];
  topIntents?: IntentData[];
  timeSaved?: number;
  moneySaved?: number;
  
  // Metrics from Supabase
  happyFaceCount?: number;
  neutralFaceCount?: number;
  sadFaceCount?: number;
  escalatedCount?: number;
  successfulAnswerCount?: number;
  fallbackCount?: number;
  feedbackTimeSeries?: FeedbackTimeSeriesData[];
  escalationTimeSeries?: TimeSeriesData[];
  successVsFallbackTimeSeries?: SuccessVsFallbackTimeSeriesData[];
  
  // Thumbs up/down feedback metrics
  thumbsUpCount?: number;
  thumbsDownCount?: number;
}

export interface LoadingState {
  summaryCards: boolean;
  messageChart: boolean;
  userChart: boolean;
  sessionChart: boolean;
  intentChart: boolean;
  feedbackChart: boolean;
  escalationChart: boolean;
  fallbackChart: boolean;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

// Alias for backward compatibility
export type TimeSeriesDataPoint = TimeSeriesData;

// Chart data point for bar/pie charts
export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface FeedbackTimeSeriesData {
  date: string;
  happy_face: number;
  neutral_face: number;
  sad_face: number;
}

export interface SuccessVsFallbackTimeSeriesData {
  date: string;
  successful_answer: number;
  fallback: number;
}

export interface IntentData {
  name: string;
  count: number;
}

export type DateRange = {
  from: Date;
  to: Date;
  // Adding these for backward compatibility
  start?: Date;
  end?: Date;
};

export type TimeRange = '7d' | '30d' | '90d' | '365d' | 'all' | 'custom';

export interface SavingsSettings {
  timePerMessage: number; // minutes
  hourlyRate: number; // NOK
}

export interface MetricsResponse {
  totals: {
    happy_face: number;
    neutral_face: number;
    sad_face: number;
    escalated_to_human: number;
    successful_answer: number;
    thumbs_up: number;
    thumbs_down: number;
  };
  timeSeries: Array<{
    date: string;
    happy_face: number;
    neutral_face: number;
    sad_face: number;
    escalated_to_human: number;
    successful_answer: number;
    thumbs_up: number;
    thumbs_down: number;
  }>;
  rawMetrics: Array<{
    id: string;
    organization_id: string;
    metric_type: 'happy_face' | 'neutral_face' | 'sad_face' | 'escalated_to_human' | 'successful_answer' | 'thumbs_up' | 'thumbs_down';
    timestamp: string;
    created_at: string;
  }>;
}
