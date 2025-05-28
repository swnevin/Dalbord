import React from "react";
import { SummaryCards } from "./SummaryCards";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { BarChart } from "./BarChart";
import { FeedbackChart } from "./FeedbackChart";
import { FeedbackPieChart } from "./FeedbackPieChart";
import { SuccessVsFallbackChart } from "./SuccessVsFallbackChart";
import { SuccessVsFallbackPieChart } from "./SuccessVsFallbackPieChart";
import { SavingsCharts } from "./SavingsCharts";
import { FeedbackSummaryCards } from "./FeedbackSummaryCards";
import { SuccessMetricsCards } from "./SuccessMetricsCards";
import { StatisticsHeader } from "./StatisticsHeader";
import { useStatistics } from "./hooks/useStatistics";
import { useChartPreferences } from "./hooks/useChartPreferences";

const Statistics = () => {
  const { 
    data, 
    loading, 
    error, 
    refetch, 
    dateRange, 
    setDateRange, 
    timeRange, 
    setTimeRange 
  } = useStatistics();
  
  const { isChartVisible, isSectionVisible } = useChartPreferences();

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Feil ved lasting av statistikk</p>
          <button 
            onClick={refetch}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Prøv igjen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatisticsHeader 
        dateRange={dateRange}
        setDateRange={setDateRange}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        onRefresh={refetch}
      />

      {isSectionVisible('summary') && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Sammendrag</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isChartVisible('total_messages') && (
              <SummaryCards 
                title="Totale meldinger" 
                value={data.totalMessages || 0} 
                isLoading={loading.summaryCards}
              />
            )}
            {isChartVisible('total_sessions') && (
              <SummaryCards 
                title="Totale økter" 
                value={data.totalSessions || 0} 
                isLoading={loading.summaryCards}
              />
            )}
            {isChartVisible('total_conversations') && (
              <SummaryCards 
                title="Totale samtaler" 
                value={data.totalConversations || 0} 
                isLoading={loading.summaryCards}
              />
            )}
            {isChartVisible('escalated_count') && (
              <SummaryCards 
                title="Eskalerte samtaler" 
                value={data.escalatedCount || 0} 
                isLoading={loading.summaryCards}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isChartVisible('thumbs_up') && (
              <SummaryCards 
                title="Thumbs Up" 
                value={data.thumbsUpCount || 0} 
                isLoading={loading.summaryCards}
              />
            )}
            {isChartVisible('thumbs_down') && (
              <SummaryCards 
                title="Thumbs Down" 
                value={data.thumbsDownCount || 0} 
                isLoading={loading.summaryCards}
              />
            )}
            {isChartVisible('success_metrics') && (
              <SuccessMetricsCards
                successfulAnswerCount={data.successfulAnswerCount || 0}
                fallbackCount={data.fallbackCount || 0}
                isLoading={loading.summaryCards}
              />
            )}
          </div>

          <FeedbackSummaryCards
            happyFaceCount={data.happyFaceCount || 0}
            neutralFaceCount={data.neutralFaceCount || 0}
            sadFaceCount={data.sadFaceCount || 0}
            isLoading={loading.summaryCards}
          />
        </div>
      )}

      {isSectionVisible('detailed_analysis') && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Detaljert analyse</h2>
          
          {isChartVisible('messages_over_time') && data.messageTimeSeries && data.messageTimeSeries.length > 0 && (
            <TimeSeriesChart 
              title="Meldinger over tid" 
              data={data.messageTimeSeries} 
              isLoading={loading.messageChart} 
              dataKey="value"
            />
          )}
          
          {isChartVisible('users_over_time') && data.userTimeSeries && data.userTimeSeries.length > 0 && (
            <TimeSeriesChart 
              title="Brukere over tid" 
              data={data.userTimeSeries} 
              isLoading={loading.userChart} 
              dataKey="value"
            />
          )}
          
          {isChartVisible('sessions_over_time') && data.sessionTimeSeries && data.sessionTimeSeries.length > 0 && (
            <TimeSeriesChart 
              title="Økter over tid" 
              data={data.sessionTimeSeries} 
              isLoading={loading.sessionChart} 
              dataKey="value"
            />
          )}
          
          {isChartVisible('topics') && data.topIntents && data.topIntents.length > 0 && (
            <BarChart 
              title="Mest populære emner" 
              data={data.topIntents} 
              isLoading={loading.intentChart} 
              dataKey="count"
            />
          )}
        </div>
      )}

      {isSectionVisible('question_handling') && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Håndtering av spørsmål</h2>
          
          {isChartVisible('feedback_pie') && (
            <FeedbackPieChart
              happyFaceCount={data.happyFaceCount || 0}
              neutralFaceCount={data.neutralFaceCount || 0}
              sadFaceCount={data.sadFaceCount || 0}
              isLoading={loading.feedbackChart}
            />
          )}

          {isChartVisible('success_vs_fallback') && (
            <>
              {data.successVsFallbackTimeSeries && data.successVsFallbackTimeSeries.length > 0 && (
                <SuccessVsFallbackChart
                  title="Suksess vs. Fallback over tid"
                  data={data.successVsFallbackTimeSeries}
                  isLoading={loading.fallbackChart}
                />
              )}
              <SuccessVsFallbackPieChart
                successfulAnswerCount={data.successfulAnswerCount || 0}
                fallbackCount={data.fallbackCount || 0}
                isLoading={loading.fallbackChart}
              />
            </>
          )}

          {isChartVisible('feedback_pie') && data.feedbackTimeSeries && data.feedbackTimeSeries.length > 0 && (
            <FeedbackChart 
              title="Tilbakemeldinger over tid" 
              data={data.feedbackTimeSeries} 
              isLoading={loading.feedbackChart}
            />
          )}
        </div>
      )}

      {isSectionVisible('savings') && (
        <SavingsCharts 
          timeSaved={data.timeSaved || 0}
          moneySaved={data.moneySaved || 0}
          isLoading={loading.summaryCards}
        />
      )}
    </div>
  );
};

export default Statistics;
