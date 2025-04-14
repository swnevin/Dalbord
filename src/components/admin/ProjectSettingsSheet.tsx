
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { Database } from "@/integrations/supabase/types";
import { ChartPreference, ChartType } from "../statistics/hooks/useChartPreferences";

interface ProjectSettingsSheetProps {
  organizationId: string;
  organizationName: string;
}

// Maps chart types to human-readable names
const chartLabels: Record<ChartType, string> = {
  total_messages: "Antall meldinger",
  total_sessions: "Antall samtaler",
  total_conversations: "Antall brukere",
  escalated_count: "Eskalerte samtaler",
  thumbs_up: "Tommel opp",
  thumbs_down: "Tommel ned",
  success_metrics: "Vellykkede svar og Fallback",
  users_over_time: "Brukere over tid",
  sessions_over_time: "Samtaler over tid",
  messages_over_time: "Meldinger over tid",
  topics: "Temaer",
  feedback_pie: "Tilbakemeldinger på svar",
  success_vs_fallback: "Svar vs Fallback",
  savings_time: "Timer spart",
  savings_money: "Penger spart"
};

// Group chart types by section
const chartGroups: Record<string, ChartType[]> = {
  summary: [
    "total_messages", 
    "total_sessions", 
    "total_conversations", 
    "escalated_count", 
    "thumbs_up", 
    "thumbs_down", 
    "success_metrics"
  ],
  detailed_analysis: [
    "users_over_time", 
    "sessions_over_time", 
    "messages_over_time", 
    "topics"
  ],
  question_handling: [
    "feedback_pie", 
    "success_vs_fallback"
  ],
  savings: [
    "savings_time", 
    "savings_money"
  ]
};

// Translate section names
const sectionLabels: Record<string, string> = {
  summary: "Sammendrag",
  detailed_analysis: "Detaljert analyse",
  question_handling: "Håndtering av spørsmål",
  savings: "Besparelser"
};

export const ProjectSettingsSheet = ({ organizationId, organizationName }: ProjectSettingsSheetProps) => {
  const [preferences, setPreferences] = useState<ChartPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch chart preferences for this organization
  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("statistics_preferences")
        .select("*")
        .eq("organization_id", organizationId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPreferences(data || []);
    } catch (error) {
      console.error("Error fetching statistics preferences:", error);
      toast.error("Kunne ikke hente statistikkinnstillinger");
    } finally {
      setIsLoading(false);
    }
  };

  // Update a single preference
  const updateChartVisibility = async (chartType: ChartType, isVisible: boolean) => {
    const updatedPreferences = preferences.map(pref => 
      pref.chart_type === chartType ? { ...pref, is_visible: isVisible } : pref
    );
    
    setPreferences(updatedPreferences);
    
    try {
      const { error } = await supabase
        .from("statistics_preferences")
        .update({ is_visible: isVisible })
        .eq("organization_id", organizationId)
        .eq("chart_type", chartType);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating chart visibility:", error);
      toast.error("Kunne ikke oppdatere innstillingene");
      // Revert the local state change on error
      fetchPreferences();
    }
  };

  // Save all preferences at once
  const saveAllPreferences = async () => {
    setIsSaving(true);
    try {
      // We need to type-cast the array properly for the upsert operation
      const { error } = await supabase
        .from("statistics_preferences")
        .upsert(
          preferences.map(pref => ({
            id: pref.id,
            organization_id: pref.organization_id,
            chart_type: pref.chart_type,
            is_visible: pref.is_visible,
            display_order: pref.display_order
          }))
        );

      if (error) throw error;
      toast.success("Innstillingene ble lagret");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Kunne ikke lagre innstillingene");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [organizationId]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="ml-2">
          <Settings className="h-4 w-4" />
          Prosjektinnstillinger
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Prosjektinnstillinger for {organizationName}</SheetTitle>
          <SheetDescription>
            Administrer innstillinger for prosjektet her.
          </SheetDescription>
        </SheetHeader>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Rediger Statistikk-fanen</CardTitle>
            <CardDescription>
              Velg hvilke diagrammer som skal vises i statistikk-fanen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader size="md" text="Laster innstillinger..." />
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(chartGroups).map(([sectionKey, chartTypes]) => (
                  <AccordionItem key={sectionKey} value={sectionKey}>
                    <AccordionTrigger className="text-primary font-medium">
                      {sectionLabels[sectionKey]}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {chartTypes.map(chartType => {
                          const preference = preferences.find(p => p.chart_type === chartType);
                          if (!preference) return null;
                          
                          return (
                            <div key={chartType} className="flex items-center justify-between">
                              <Label 
                                htmlFor={`chart-${chartType}`}
                                className="cursor-pointer"
                              >
                                {chartLabels[chartType] || chartType}
                              </Label>
                              <Switch
                                id={`chart-${chartType}`}
                                checked={preference.is_visible}
                                onCheckedChange={(checked) => updateChartVisibility(chartType, checked)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet>
  );
};
