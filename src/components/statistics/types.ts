
export interface StatisticsData {
  totalMessages?: number;
  totalConversations?: number;
  messageTimeSeries?: TimeSeriesData[];
  userTimeSeries?: TimeSeriesData[];
}

export interface LoadingState {
  summaryCards: boolean;
  messageChart: boolean;
  userChart: boolean;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export type DateRange = {
  from: Date;
  to: Date;
};

export type TimeRange = '7d' | '30d' | '90d' | '365d' | 'all' | 'custom';
