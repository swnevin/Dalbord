
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

export const Statistics = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [dateRange, setDateRange] = useState<DateRange>(updateDateRange('7d'));
  const [savingsSettings, setSavingsSettings] = useState<SavingsSettings>({
    timePerMessage: 2, // default: 2 minutes per message
    hourlyRate: 300    // default: 300 NOK per hour
  });

  // Section open/close state
  const [sectionsOpen, setSectionsOpen] = useState({
    overview: true,
    feedback: true,
    performance: true,
    details: true
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

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper component for section headers
  const SectionHeader = ({ 
    title, 
    section,
    className = ""
  }: { 
    title: string, 
    section: keyof typeof sectionsOpen,
    className?: string
  }) => (
    <div className={`flex items-center gap-2 py-2 mb-4 cursor-pointer ${className}`} onClick={() => toggleSection(section)}>
      {sectionsOpen[section] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="flex-grow border-t border-gray-200 ml-2"></div>
    </div>
  );

  // Data source notice component
  const DataSourceNotice = ({ isSupabase = false }: { isSupabase?: boolean }) => (
    <div className="text-xs text-muted-foreground mt-1 mb-3 italic">
      {isSupabase 
        ? "Merk: Dataene starter fra første registrerte innslag i Supabase-databasen"
        : "Merk: Dataene hentes fra Voiceflow API og går tilbake til oppstart"
      }
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      <StatisticsHeader
        timeRange={timeRange}
        dateRange={dateRange}
        onTimeRangeChange={setTimeRange}
        onDateRangeChange={setDateRange}
      />
      
      {/* System Overview Section */}
      <Collapsible open={sectionsOpen.overview} onOpenChange={() => toggleSection('overview')}>
        <CollapsibleTrigger asChild>
          <div className="w-full">
            <SectionHeader title="Systemoversikt" section="overview" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="md:col-span-3">
              <SummaryCards
                totalMessages={data.totalMessages ?? 0}
                totalSessions={data.totalSessions ?? 0}
                totalConversations={data.totalConversations ?? 0}
                isLoading={loading.summaryCards}
              />
              <DataSourceNotice />
            </div>
            <div className="md:col-span-3 grid grid-cols-3 gap-4">
              {data.hasEscalationData && (
                <FeedbackSummaryCards
                  escalatedCount={data.escalatedCount ?? 0}
                  isLoading={loading.feedbackChart}
                />
              )}
              {data.hasSuccessVsFallbackData && (
                <SuccessMetricsCards
                  successfulAnswerCount={data.successfulAnswerCount ?? 0}
                  fallbackCount={data.fallbackCount ?? 0}
                  isLoading={loading.fallbackChart}
                />
              )}
              {(data.hasEscalationData || data.hasSuccessVsFallbackData) && (
                <DataSourceNotice isSupabase={true} />
              )}
            </div>
          </div>
        
          <SavingsCharts
            timeSaved={data.timeSaved ?? 0}
            moneySaved={data.moneySaved ?? 0}
            isLoading={loading.summaryCards}
            timePerMessage={savingsSettings.timePerMessage}
            hourlyRate={savingsSettings.hourlyRate}
            onSettingsChange={handleSavingsSettingsChange}
            totalMessages={data.totalMessages ?? 0}
          />
        </CollapsibleContent>
      </Collapsible>
      
      {/* User Feedback Section - Only show if there's feedback data */}
      {data.hasFeedbackData && (
        <Collapsible open={sectionsOpen.feedback} onOpenChange={() => toggleSection('feedback')}>
          <CollapsibleTrigger asChild>
            <div className="w-full">
              <SectionHeader title="Brukertilbakemeldinger" section="feedback" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
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
            <DataSourceNotice isSupabase={true} />
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {/* System Performance Section - Only show if there's success/fallback data */}
      {data.hasSuccessVsFallbackData && (
        <Collapsible open={sectionsOpen.performance} onOpenChange={() => toggleSection('performance')}>
          <CollapsibleTrigger asChild>
            <div className="w-full">
              <SectionHeader title="Systemytelse" section="performance" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
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
            <DataSourceNotice isSupabase={true} />
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {/* Detailed Statistics Section */}
      <Collapsible open={sectionsOpen.details} onOpenChange={() => toggleSection('details')}>
        <CollapsibleTrigger asChild>
          <div className="w-full">
            <SectionHeader title="Detaljert statistikk" section="details" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid gap-8">
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
          <DataSourceNotice />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
