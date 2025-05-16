
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

export type ChartType = 
  | "total_messages" 
  | "total_sessions" 
  | "total_conversations" 
  | "escalated_count" 
  | "thumbs_up" 
  | "thumbs_down" 
  | "success_metrics"
  | "users_over_time" 
  | "sessions_over_time" 
  | "messages_over_time" 
  | "topics"
  | "feedback_pie" 
  | "success_vs_fallback"
  | "savings_time" 
  | "savings_money"
  | "add_to_cart";

export interface ChartPreference {
  id: string;
  chart_type: ChartType;
  is_visible: boolean;
  display_order: number;
  organization_id: string;
}

export const useChartPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ChartPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Group chart types by section
  const chartGroups: Record<string, ChartType[]> = {
    summary: [
      "total_messages", 
      "total_sessions", 
      "total_conversations", 
      "escalated_count", 
      "thumbs_up", 
      "thumbs_down", 
      "success_metrics",
      "add_to_cart"
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

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user?.organization_id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("statistics_preferences")
          .select("*")
          .eq("organization_id", user.organization_id)
          .order("display_order", { ascending: true });

        if (error) throw error;
        setPreferences(data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching chart preferences:", err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user?.organization_id]);

  const isChartVisible = (chartType: ChartType): boolean => {
    const preference = preferences.find(p => p.chart_type === chartType);
    return preference ? preference.is_visible : true; // Default to visible if preference not found
  };
  
  const isSectionVisible = (sectionKey: string): boolean => {
    const sectionCharts = chartGroups[sectionKey] || [];
    return sectionCharts.some(chartType => isChartVisible(chartType));
  };

  return {
    preferences,
    isLoading,
    error,
    isChartVisible,
    isSectionVisible
  };
};
