
import { useState, useEffect } from "react";
import { updateDateRange } from "./utils/dateUtils";
import { StatisticsHeader } from "./StatisticsHeader";
import { SummaryCards } from "./SummaryCards";
import { FeedbackSummaryCards } from "./FeedbackSummaryCards";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { BarChart } from "./BarChart";
import { FeedbackPieChart } from "./FeedbackPieChart";
import { SavingsCharts } from "./SavingsCharts";
import { SuccessMetricsCards } from "./SuccessMetricsCards";
import { SuccessVsFallbackPieChart } from "./SuccessVsFallbackPieChart";
import { DateRange, TimeRange, SavingsSettings } from "./types";
import { useStatistics } from "./hooks/useStatistics";
import { useChartPreferences } from "./hooks/useChartPreferences";
import { Separator } from "@/components/ui/separator";
import { ChartBarIcon, TrendingUpIcon, MessageSquareIcon, UserRoundIcon } from "lucide-react";

export const Statistics = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [dateRange, setDateRange] = useState<DateRange>(updateDateRange('7d'));
  const [savingsSettings, setSavingsSettings] = useState<SavingsSettings>({
    timePerMessage: 2, // default: 2 minutes per message
    hourlyRate: 300    // default: 300 NOK per hour
  });

  // Fetch statistics data using our custom hooks
  const { data, loading } = useStatistics(dateRange, timeRange, savingsSettings);
  const { isChartVisible, isLoading: isLoadingPreferences } = useChartPreferences();

  // Update date range when time range changes
  useEffect(() => {
    if (timeRange !== 'custom') {
      setDateRange(updateDateRange(timeRange));
    }
  }, [timeRange]);

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

      {/* Summary Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <ChartBarIcon size={20} />
          <h2 className="text-xl font-semibold">Sammendrag</h2>
        </div>
        <Separator className="bg-primary/10" />
        
        <div className="grid gap-4 grid-cols-1">
          <div className="grid grid-cols-1 gap-4">
            {isChartVisible('total_messages') && (
              <SummaryCards
                totalMessages={data.totalMessages ?? 0}
                totalSessions={data.totalSessions ?? 0}
                totalConversations={data.totalConversations ?? 0}
                isLoading={loading.summaryCards || isLoadingPreferences}
              />
            )}
            
            {isChartVisible('thumbs_up') && (
              <FeedbackSummaryCards
                escalatedCount={data.escalatedCount ?? 0}
                thumbsUpCount={data.thumbsUpCount ?? 0}
                thumbsDownCount={data.thumbsDownCount ?? 0}
                isLoading={loading.feedbackChart || isLoadingPreferences}
              />
            )}
            
            {isChartVisible('success_metrics') && (
              <SuccessMetricsCards
                successfulAnswerCount={data.successfulAnswerCount ?? 0}
                fallbackCount={data.fallbackCount ?? 0}
                isLoading={loading.fallbackChart || isLoadingPreferences}
              />
            )}
          </div>
        </div>
      </div>

      {/* Detailed Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <UserRoundIcon size={20} />
          <h2 className="text-xl font-semibold">Detaljert analyse</h2>
        </div>
        <Separator className="bg-primary/10" />
        
        {/* TimeSeriesCharts */}
        {isChartVisible('users_over_time') && (
          <TimeSeriesChart
            data={data.userTimeSeries}
            title="Brukere over tid"
            description="Antall unike brukere som har interagert med systemet over tid."
            color="#28483f"
            isLoading={loading.userChart || isLoadingPreferences}
            loadingText="Laster brukerstatistikk..."
          />
        )}
        
        {isChartVisible('sessions_over_time') && (
          <TimeSeriesChart
            data={data.sessionTimeSeries}
            title="Samtaler over tid"
            description="Totalt antall samtaler (økter) gjennomført i systemet over tid."
            color="#28483F"
            isLoading={loading.sessionChart || isLoadingPreferences}
            loadingText="Laster samtalestatistikk..."
          />
        )}
        
        {isChartVisible('messages_over_time') && (
          <TimeSeriesChart
            data={data.messageTimeSeries}
            title="Meldinger over tid"
            description="Totalt antall meldinger sendt i systemet over tid."
            color="#28483F"
            isLoading={loading.messageChart || isLoadingPreferences}
            loadingText="Laster meldingsstatistikk..."
          />
        )}
        
        {/* Bar chart */}
        {isChartVisible('topics') && (
          <BarChart
            data={data.topIntents}
            title="Temaer"
            description="De vanligste temaene brukerne spør om i systemet."
            color="#28483F"
            isLoading={loading.intentChart || isLoadingPreferences}
            loadingText="Laster tema-statistikk..."
            limit={10}
            layout="horizontal" 
          />
        )}
      </div>

      {/* Håndtering av spørsmål Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <MessageSquareIcon size={20} />
          <h2 className="text-xl font-semibold">Håndtering av spørsmål</h2>
        </div>
        <Separator className="bg-primary/10" />
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {isChartVisible('feedback_pie') && (
            <FeedbackPieChart
              thumbsUpCount={data.thumbsUpCount ?? 0}
              thumbsDownCount={data.thumbsDownCount ?? 0}
              successfulAnswerCount={data.successfulAnswerCount ?? 0}
              isLoading={loading.feedbackChart || loading.fallbackChart || isLoadingPreferences}
            />
          )}
          
          {isChartVisible('success_vs_fallback') && (
            <SuccessVsFallbackPieChart
              successfulAnswerCount={data.successfulAnswerCount ?? 0}
              fallbackCount={data.fallbackCount ?? 0}
              isLoading={loading.fallbackChart || isLoadingPreferences}
            />
          )}
        </div>
      </div>

      {/* Savings Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <TrendingUpIcon size={20} />
          <h2 className="text-xl font-semibold">Besparelser</h2>
        </div>
        <Separator className="bg-primary/10" />
        
        {(isChartVisible('savings_time') || isChartVisible('savings_money')) && (
          <SavingsCharts
            timeSaved={data.timeSaved ?? 0}
            moneySaved={data.moneySaved ?? 0}
            isLoading={loading.summaryCards || isLoadingPreferences}
            timePerMessage={savingsSettings.timePerMessage}
            hourlyRate={savingsSettings.hourlyRate}
            onSettingsChange={handleSavingsSettingsChange}
            totalMessages={data.totalMessages ?? 0}
          />
        )}
      </div>
    </div>
  );
};
