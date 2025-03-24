
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
import { Separator } from "@/components/ui/separator";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

// Component to display a data source note
const DataSourceNote = ({ type }: { type: 'supabase' | 'voiceflow' }) => {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground italic mt-1">
      <Info className="h-3 w-3" />
      {type === 'supabase' ? (
        <span>Data starter fra første registrerte datapunkt i Supabase.</span>
      ) : (
        <span>Data hentet fra Voiceflow API.</span>
      )}
    </div>
  );
};

// Section header component with collapsible functionality
const SectionHeader = ({ 
  title, 
  isOpen, 
  onToggle 
}: { 
  title: string, 
  isOpen: boolean, 
  onToggle: () => void 
}) => {
  return (
    <div className="flex items-center justify-between mb-4 mt-8">
      <h2 className="text-2xl font-semibold text-primary">{title}</h2>
      <button 
        onClick={onToggle} 
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        {isOpen ? (
          <>Skjul <ChevronUp className="h-4 w-4" /></>
        ) : (
          <>Vis <ChevronDown className="h-4 w-4" /></>
        )}
      </button>
    </div>
  );
};

export const Statistics = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [dateRange, setDateRange] = useState<DateRange>(updateDateRange('7d'));
  const [savingsSettings, setSavingsSettings] = useState<SavingsSettings>({
    timePerMessage: 2, // default: 2 minutes per message
    hourlyRate: 300    // default: 300 NOK per hour
  });
  
  // Section visibility states
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [engagementOpen, setEngagementOpen] = useState(true);
  const [performanceOpen, setPerformanceOpen] = useState(true);

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
    <div className="p-8 space-y-4">
      <StatisticsHeader
        timeRange={timeRange}
        dateRange={dateRange}
        onTimeRangeChange={setTimeRange}
        onDateRangeChange={setDateRange}
      />
      
      {/* System Overview Section */}
      <Collapsible open={overviewOpen} onOpenChange={setOverviewOpen} className="w-full">
        <SectionHeader 
          title="Systemoversikt" 
          isOpen={overviewOpen} 
          onToggle={() => setOverviewOpen(!overviewOpen)} 
        />
        <CollapsibleContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="md:col-span-3">
              <SummaryCards
                totalMessages={data.totalMessages ?? 0}
                totalSessions={data.totalSessions ?? 0}
                totalConversations={data.totalConversations ?? 0}
                isLoading={loading.summaryCards}
              />
              <DataSourceNote type="voiceflow" />
            </div>
            <div className="md:col-span-3 grid grid-cols-3 gap-4">
              <FeedbackSummaryCards
                escalatedCount={data.escalatedCount ?? 0}
                isLoading={loading.feedbackChart}
              />
              <SuccessMetricsCards
                successfulAnswerCount={data.successfulAnswerCount ?? 0}
                fallbackCount={data.fallbackCount ?? 0}
                isLoading={loading.fallbackChart}
              />
              <DataSourceNote type="supabase" />
            </div>
          </div>

          <div className="mt-6">
            <SavingsCharts
              timeSaved={data.timeSaved ?? 0}
              moneySaved={data.moneySaved ?? 0}
              isLoading={loading.summaryCards}
              timePerMessage={savingsSettings.timePerMessage}
              hourlyRate={savingsSettings.hourlyRate}
              onSettingsChange={handleSavingsSettingsChange}
              totalMessages={data.totalMessages ?? 0}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <Separator className="my-4" />
      
      {/* User Feedback Section */}
      <Collapsible open={engagementOpen} onOpenChange={setEngagementOpen} className="w-full">
        <SectionHeader 
          title="Brukertilbakemeldinger" 
          isOpen={engagementOpen} 
          onToggle={() => setEngagementOpen(!engagementOpen)} 
        />
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
            <DataSourceNote type="supabase" />
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <Separator className="my-4" />
      
      {/* System Performance Section */}
      <Collapsible open={performanceOpen} onOpenChange={setPerformanceOpen} className="w-full">
        <SectionHeader 
          title="Systemytelse" 
          isOpen={performanceOpen} 
          onToggle={() => setPerformanceOpen(!performanceOpen)} 
        />
        <CollapsibleContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-6">
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
            <DataSourceNote type="supabase" />
          </div>

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
            <DataSourceNote type="voiceflow" />
            
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
            <DataSourceNote type="voiceflow" />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
