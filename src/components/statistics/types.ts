
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
}

export interface LoadingState {
  summaryCards: boolean;
  messageChart: boolean;
  userChart: boolean;
  sessionChart: boolean;
  intentChart: boolean;
}

export interface TimeSeriesData {
  date: string;
  value: number;
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
