
import React, { useState, useEffect } from "react";
import { updateDateRange } from "./utils/dateUtils";
import { StatisticsHeader } from "./StatisticsHeader";
import { SummaryCards } from "./SummaryCards";
import { FeedbackSummaryCards } from "./FeedbackSummaryCards";
import { SavingsCharts } from "./SavingsCharts";
import { SuccessMetricsCards } from "./SuccessMetricsCards";
import { DateRange, TimeRange, SavingsSettings, HighchartsSeriesData } from "./types";
import { useStatistics } from "./hooks/useStatistics";
import { useChartPreferences, ChartType } from "./hooks/useChartPreferences";
import { Separator } from "@/components/ui/separator";
import { ChartBarIcon, TrendingUpIcon, MessageSquareIcon, UserRoundIcon } from "lucide-react";

// Import new Highcharts components
import { HighchartsTimeSeries } from "./HighchartsTimeSeries";
import { HighchartsBarChart } from "./HighchartsBarChart";
import { HighchartsPieChart } from "./HighchartsPieChart";
import { HighchartsMultiSeries } from "./HighchartsMultiSeries";
import applyDalaiTheme from "./HighchartsTheme";

export const Statistics = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [dateRange, setDateRange] = useState<DateRange>(updateDateRange('7d'));
  const [savingsSettings, setSavingsSettings] = useState<SavingsSettings>({
    timePerMessage: 2, // default: 2 minutes per message
    hourlyRate: 300    // default: 300 NOK per hour
  });

  // Apply Highcharts theme on component mount
  useEffect(() => {
    applyDalaiTheme();
  }, []);

  const { data, loading } = useStatistics(dateRange, timeRange, savingsSettings);
  const { isChartVisible, isSectionVisible, isLoading: isLoadingPreferences } = useChartPreferences();

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

  // Helper function to prepare feedback data for the pie chart
  const prepareFeedbackPieData = () => {
    return [
      { name: 'Tommel opp 👍', y: data.thumbsUpCount || 0, color: '#28483F' },
      { name: 'Tommel ned 👎', y: data.thumbsDownCount || 0, color: '#8E9196' }
    ];
  };

  // Helper function to prepare success vs fallback data for the pie chart
  const prepareSuccessVsFallbackPieData = () => {
    return [
      { name: 'Vellykkede svar', y: data.successfulAnswerCount || 0, color: '#28483F' },
      { name: 'Fallback', y: data.fallbackCount || 0, color: '#E2B808' }
    ];
  };

  // Helper function to prepare feedback time series data
  const prepareFeedbackTimeSeriesData = () => {
    if (!data.feedbackTimeSeries || data.feedbackTimeSeries.length === 0) {
      return { series: [], categories: [] };
    }

    const categories = data.feedbackTimeSeries.map(item => item.date);
    const series: HighchartsSeriesData[] = [
      { 
        name: 'Fornøyde 🙂', 
        data: data.feedbackTimeSeries.map(item => item.happy_face), 
        color: '#28483F',
        type: 'spline'
      },
      { 
        name: 'Nøytrale 😐', 
        data: data.feedbackTimeSeries.map(item => item.neutral_face), 
        color: '#E2B808',
        type: 'spline'
      },
      { 
        name: 'Misfornøyde 🙁', 
        data: data.feedbackTimeSeries.map(item => item.sad_face), 
        color: '#8E9196',
        type: 'spline'
      }
    ];

    return { series, categories };
  };

  // Helper function to prepare success vs fallback time series data
  const prepareSuccessVsFallbackTimeSeriesData = () => {
    if (!data.successVsFallbackTimeSeries || data.successVsFallbackTimeSeries.length === 0) {
      return { series: [], categories: [] };
    }

    const categories = data.successVsFallbackTimeSeries.map(item => item.date);
    const series: HighchartsSeriesData[] = [
      { 
        name: 'Vellykkede svar', 
        data: data.successVsFallbackTimeSeries.map(item => item.successful_answer), 
        color: '#28483F',
        type: 'spline'
      },
      { 
        name: 'Fallback', 
        data: data.successVsFallbackTimeSeries.map(item => item.fallback), 
        color: '#E2B808',
        type: 'spline'
      }
    ];

    return { series, categories };
  };

  const feedbackTimeSeriesData = prepareFeedbackTimeSeriesData();
  const successVsFallbackTimeSeriesData = prepareSuccessVsFallbackTimeSeriesData();

  return (
    <div className="p-8 space-y-8">
      <StatisticsHeader
        timeRange={timeRange}
        dateRange={dateRange}
        onTimeRangeChange={setTimeRange}
        onDateRangeChange={setDateRange}
      />

      {/* Summary Section */}
      {isSectionVisible('summary') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <ChartBarIcon size={20} />
            <h2 className="text-xl font-semibold">Sammendrag</h2>
          </div>
          <Separator className="bg-primary/10" />
          
          <div className="grid gap-4 grid-cols-1">
            <div className="grid grid-cols-1 gap-4">
              {isChartVisible('total_messages' as ChartType) && (
                <SummaryCards
                  totalMessages={data.totalMessages ?? 0}
                  totalSessions={data.totalSessions ?? 0}
                  totalConversations={data.totalConversations ?? 0}
                  isLoading={loading.summaryCards || isLoadingPreferences}
                />
              )}
              
              {isChartVisible('thumbs_up' as ChartType) && (
                <FeedbackSummaryCards
                  escalatedCount={data.escalatedCount ?? 0}
                  thumbsUpCount={data.thumbsUpCount ?? 0}
                  thumbsDownCount={data.thumbsDownCount ?? 0}
                  isLoading={loading.feedbackChart || isLoadingPreferences}
                />
              )}
              
              {isChartVisible('success_metrics' as ChartType) && (
                <SuccessMetricsCards
                  successfulAnswerCount={data.successfulAnswerCount ?? 0}
                  fallbackCount={data.fallbackCount ?? 0}
                  isLoading={loading.fallbackChart || isLoadingPreferences}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Analytics Section */}
      {isSectionVisible('detailed_analysis') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <UserRoundIcon size={20} />
            <h2 className="text-xl font-semibold">Detaljert analyse</h2>
          </div>
          <Separator className="bg-primary/10" />
          
          <div className="grid gap-4 grid-cols-1">
            {isChartVisible('users_over_time' as ChartType) && (
              <HighchartsTimeSeries
                data={data.userTimeSeries}
                title="Brukere over tid"
                description="Antall unike brukere som har interagert med systemet over tid."
                color="#28483f"
                isLoading={loading.userChart || isLoadingPreferences}
                loadingText="Laster brukerstatistikk..."
                chartType="areaspline"
              />
            )}
            
            {isChartVisible('sessions_over_time' as ChartType) && (
              <HighchartsTimeSeries
                data={data.sessionTimeSeries}
                title="Samtaler over tid"
                description="Totalt antall samtaler (økter) gjennomført i systemet over tid."
                color="#28483F"
                isLoading={loading.sessionChart || isLoadingPreferences}
                loadingText="Laster samtalestatistikk..."
                chartType="spline"
              />
            )}
            
            {isChartVisible('messages_over_time' as ChartType) && (
              <HighchartsTimeSeries
                data={data.messageTimeSeries}
                title="Meldinger over tid"
                description="Totalt antall meldinger sendt i systemet over tid."
                color="#28483F"
                isLoading={loading.messageChart || isLoadingPreferences}
                loadingText="Laster meldingsstatistikk..."
                chartType="spline"
              />
            )}
            
            {isChartVisible('topics' as ChartType) && (
              <HighchartsBarChart
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
        </div>
      )}

      {/* Håndtering av spørsmål Section */}
      {isSectionVisible('question_handling') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <MessageSquareIcon size={20} />
            <h2 className="text-xl font-semibold">Håndtering av spørsmål</h2>
          </div>
          <Separator className="bg-primary/10" />
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {isChartVisible('feedback_pie' as ChartType) && (
              <HighchartsPieChart
                data={prepareFeedbackPieData()}
                title="Tilbakemeldinger på svar"
                description="Fordeling av brukernes tommel opp/ned tilbakemeldinger på svar"
                isLoading={loading.feedbackChart || isLoadingPreferences}
                loadingText="Laster tilbakemeldingsdata..."
              />
            )}
            
            {isChartVisible('success_vs_fallback' as ChartType) && (
              <HighchartsPieChart
                data={prepareSuccessVsFallbackPieData()}
                title="Svar vs Fallback"
                description="Fordeling av vellykkede svar vs fallback-svar"
                isLoading={loading.fallbackChart || isLoadingPreferences}
                loadingText="Laster svar/fallback-data..."
              />
            )}
          </div>
          
          <div className="grid gap-4 grid-cols-1">
            {isChartVisible('feedback_over_time' as ChartType) && feedbackTimeSeriesData.series.length > 0 && (
              <HighchartsMultiSeries
                series={feedbackTimeSeriesData.series}
                categories={feedbackTimeSeriesData.categories}
                title="Tilbakemeldinger over tid"
                description="Utvikling av brukerfeedback over tid"
                isLoading={loading.feedbackChart || isLoadingPreferences}
                loadingText="Laster tilbakemeldingsdata..."
              />
            )}
            
            {isChartVisible('success_vs_fallback_over_time' as ChartType) && successVsFallbackTimeSeriesData.series.length > 0 && (
              <HighchartsMultiSeries
                series={successVsFallbackTimeSeriesData.series}
                categories={successVsFallbackTimeSeriesData.categories}
                title="Svar vs Fallback over tid"
                description="Utvikling av vellykkede svar vs fallback-svar over tid"
                isLoading={loading.fallbackChart || isLoadingPreferences}
                loadingText="Laster svar/fallback-data..."
              />
            )}
          </div>
        </div>
      )}

      {/* Savings Section */}
      {isSectionVisible('savings') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUpIcon size={20} />
            <h2 className="text-xl font-semibold">Besparelser</h2>
          </div>
          <Separator className="bg-primary/10" />
          
          <div className="grid gap-4 grid-cols-1">
            {(isChartVisible('savings_time' as ChartType) || isChartVisible('savings_money' as ChartType)) && (
              <SavingsCharts
                timeSaved={data.timeSaved ?? 0}
                moneySaved={data.moneySaved ?? 0}
                isLoading={loading.summaryCards || isLoadingPreferences}
                timePerMessage={savingsSettings.timePerMessage}
                hourlyRate={savingsSettings.hourlyRate}
                onSettingsChange={handleSavingsSettingsChange}
                totalMessages={data.totalMessages ?? 0}
                visibleCharts={{
                  time: isChartVisible('savings_time' as ChartType),
                  money: isChartVisible('savings_money' as ChartType)
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
