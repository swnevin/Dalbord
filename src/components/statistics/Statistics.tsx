
import { useState, useEffect } from "react";
import { updateDateRange } from "./utils/dateUtils";
import { StatisticsHeader } from "./StatisticsHeader";
import { SummaryCards } from "./SummaryCards";
import { FeedbackSummaryCards } from "./FeedbackSummaryCards";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { BarChart } from "./BarChart";
import { FeedbackPieChart } from "./FeedbackPieChart";
import { FeedbackLineChart } from "./FeedbackChart";
import { SavingsCharts } from "./SavingsCharts";
import { SuccessMetricsCards } from "./SuccessMetricsCards";
import { SuccessVsFallbackPieChart } from "./SuccessVsFallbackPieChart";
import { SuccessVsFallbackLineChart } from "./SuccessVsFallbackChart";
import { DateRange, TimeRange, SavingsSettings } from "./types";
import { useStatistics } from "./hooks/useStatistics";

export const Statistics = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [dateRange, setDateRange] = useState<DateRange>(updateDateRange('7d'));
  const [savingsSettings, setSavingsSettings] = useState<SavingsSettings>({
    timePerMessage: 2, // default: 2 minutes per message
    hourlyRate: 300    // default: 300 NOK per hour
  });

  // Update date range when time range changes
  useEffect(() => {
    if (timeRange !== 'custom') {
      setDateRange(updateDateRange(timeRange));
    }
  }, [timeRange]);

  // Fetch statistics data using our custom hook
  const { data, loading } = useStatistics(dateRange, timeRange, savingsSettings);

  const handleSavingsSettingsChange = (settings: Partial<SavingsSettings>) => {
    setSavingsSettings(prev => ({
      ...prev,
      ...settings
    }));
  };

  // Helper function to render only if data exists
  const renderIfHasData = (hasData: boolean, component: React.ReactNode) => {
    return hasData ? component : null;
  };

  return (
    <div className="p-8 space-y-8">
      <StatisticsHeader
        timeRange={timeRange}
        dateRange={dateRange}
        onTimeRangeChange={setTimeRange}
        onDateRangeChange={setDateRange}
      />
      
      <div className="grid gap-4 md:grid-cols-6">
        {/* Voiceflow data - always show */}
        <div className="md:col-span-3">
          <SummaryCards
            totalMessages={data.totalMessages ?? 0}
            totalSessions={data.totalSessions ?? 0}
            totalConversations={data.totalConversations ?? 0}
            isLoading={loading.summaryCards}
          />
        </div>
        
        {/* Supabase data - conditionally show */}
        <div className="md:col-span-3 grid grid-cols-3 gap-4">
          {renderIfHasData(data.hasEscalationData, 
            <FeedbackSummaryCards
              escalatedCount={data.escalatedCount ?? 0}
              isLoading={loading.feedbackChart}
            />
          )}
          
          {renderIfHasData(data.hasSuccessVsFallbackData, 
            <SuccessMetricsCards
              successfulAnswerCount={data.successfulAnswerCount ?? 0}
              fallbackCount={data.fallbackCount ?? 0}
              isLoading={loading.fallbackChart}
            />
          )}
        </div>
      </div>

      {/* Conditionally render feedback charts if data exists */}
      {data.hasFeedbackData && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <FeedbackPieChart
            happyFaceCount={data.happyFaceCount ?? 0}
            neutralFaceCount={data.neutralFaceCount ?? 0}
            sadFaceCount={data.sadFaceCount ?? 0}
            totalConversations={data.totalConversations ?? 0}
            isLoading={loading.feedbackChart || loading.summaryCards}
          />
          
          <FeedbackLineChart
            data={data.feedbackTimeSeries ?? []}
            title="Tilbakemeldinger over tid"
            description="Utvikling av brukerens tilbakemeldinger over tid"
            isLoading={loading.feedbackChart}
            loadingText="Laster tilbakemeldingsdata..."
          />
        </div>
      )}

      {/* Conditionally render success vs fallback charts if data exists */}
      {data.hasSuccessVsFallbackData && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <SuccessVsFallbackPieChart
            successfulAnswerCount={data.successfulAnswerCount ?? 0}
            fallbackCount={data.fallbackCount ?? 0}
            isLoading={loading.fallbackChart}
          />
          
          <SuccessVsFallbackLineChart
            data={data.successVsFallbackTimeSeries ?? []}
            isLoading={loading.fallbackChart}
            loadingText="Laster svar/fallback-data..."
          />
        </div>
      )}

      {/* Savings charts - related to Voiceflow data, so always show */}
      <SavingsCharts
        timeSaved={data.timeSaved ?? 0}
        moneySaved={data.moneySaved ?? 0}
        isLoading={loading.summaryCards}
        timePerMessage={savingsSettings.timePerMessage}
        hourlyRate={savingsSettings.hourlyRate}
        onSettingsChange={handleSavingsSettingsChange}
        totalMessages={data.totalMessages ?? 0}
      />

      {/* Voiceflow charts - always show */}
      <div className="grid gap-8 mt-8">
        <BarChart
          data={data.topIntents}
          title="Temaer"
          description="De vanligste temaene brukerne spør om i systemet."
          color="#28483F"
          isLoading={loading.intentChart}
          loadingText="Laster tema-statistikk..."
          limit={10}
          layout="horizontal" 
        />
        
        <TimeSeriesChart
          data={data.userTimeSeries}
          title="Brukere over tid"
          description="Antall unike brukere som har interagert med systemet over tid."
          color="#28483f"
          isLoading={loading.userChart}
          loadingText="Laster brukerstatistikk..."
        />
        
        <TimeSeriesChart
          data={data.sessionTimeSeries}
          title="Samtaler over tid"
          description="Totalt antall samtaler (økter) gjennomført i systemet over tid."
          color="#28483F"
          isLoading={loading.sessionChart}
          loadingText="Laster samtalestatistikk..."
        />
        
        <TimeSeriesChart
          data={data.messageTimeSeries}
          title="Meldinger over tid"
          description="Totalt antall meldinger sendt i systemet over tid."
          color="#28483F"
          isLoading={loading.messageChart}
          loadingText="Laster meldingsstatistikk..."
        />
      </div>
    </div>
  );
};
