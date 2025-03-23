
import { useState, useEffect } from "react";
import { updateDateRange } from "./utils/dateUtils";
import { StatisticsHeader } from "./StatisticsHeader";
import { SummaryCards } from "./SummaryCards";
import { FeedbackSummaryCards } from "./FeedbackSummaryCards";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { BarChart } from "./BarChart";
import { FeedbackChart } from "./FeedbackChart";
import { SavingsCharts } from "./SavingsCharts";
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

  return (
    <div className="p-8 space-y-8">
      <StatisticsHeader
        timeRange={timeRange}
        dateRange={dateRange}
        onTimeRangeChange={setTimeRange}
        onDateRangeChange={setDateRange}
      />
      
      <SummaryCards
        totalMessages={data.totalMessages ?? 0}
        totalSessions={data.totalSessions ?? 0}
        totalConversations={data.totalConversations ?? 0}
        isLoading={loading.summaryCards}
      />

      <FeedbackSummaryCards
        happyFaceCount={data.happyFaceCount ?? 0}
        neutralFaceCount={data.neutralFaceCount ?? 0}
        sadFaceCount={data.sadFaceCount ?? 0}
        escalatedCount={data.escalatedCount ?? 0}
        isLoading={loading.feedbackChart}
      />

      <SavingsCharts
        timeSaved={data.timeSaved ?? 0}
        moneySaved={data.moneySaved ?? 0}
        isLoading={loading.summaryCards}
        timePerMessage={savingsSettings.timePerMessage}
        hourlyRate={savingsSettings.hourlyRate}
        onSettingsChange={handleSavingsSettingsChange}
        totalMessages={data.totalMessages ?? 0}
      />

      <div className="grid gap-8 mt-8">
        {/* New Feedback Charts */}
        <FeedbackChart
          data={data.feedbackTimeSeries || []}
          title="Tilbakemeldinger over tid"
          description="Oversikt over positive, nøytrale og negative tilbakemeldinger over tid."
          isLoading={loading.feedbackChart}
          loadingText="Laster tilbakemeldingsdata..."
        />
        
        <TimeSeriesChart
          data={data.escalationTimeSeries || []}
          title="Eskalerte samtaler over tid"
          description="Antall samtaler som er eskalert til menneskelig støtte over tid."
          color="#E2B808"
          isLoading={loading.escalationChart}
          loadingText="Laster eskaleringsdata..."
        />

        <BarChart
          data={data.topIntents}
          title="Temaer"
          description="De vanligste temaene brukerne spør om i systemet."
          color="#28483F"
          isLoading={loading.intentChart}
          loadingText="Laster tema-statistikk..."
          limit={10}
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
