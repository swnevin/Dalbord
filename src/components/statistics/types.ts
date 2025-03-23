
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
  
  // New metrics from Supabase
  happyFaceCount?: number;
  neutralFaceCount?: number;
  sadFaceCount?: number;
  escalatedCount?: number;
  feedbackTimeSeries?: FeedbackTimeSeriesData[];
  escalationTimeSeries?: TimeSeriesData[];
}

export interface LoadingState {
  summaryCards: boolean;
  messageChart: boolean;
  userChart: boolean;
  sessionChart: boolean;
  intentChart: boolean;
  feedbackChart: boolean;
  escalationChart: boolean;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface FeedbackTimeSeriesData {
  date: string;
  happy_face: number;
  neutral_face: number;
  sad_face: number;
}

export interface IntentData {
  name: string;
  count: number;
}

export type DateRange = {
  from: Date;
  to: Date;
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
  };
  timeSeries: Array<{
    date: string;
    happy_face: number;
    neutral_face: number;
    sad_face: number;
    escalated_to_human: number;
  }>;
  rawMetrics: Array<{
    id: string;
    organization_id: string;
    metric_type: 'happy_face' | 'neutral_face' | 'sad_face' | 'escalated_to_human';
    timestamp: string;
    created_at: string;
  }>;
}
