
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ChartType = 
  | 'total_messages' 
  | 'users_over_time' 
  | 'sessions_over_time' 
  | 'messages_over_time'
  | 'topics'
  | 'feedback_pie'
  | 'thumbs_up'
  | 'success_vs_fallback'
  | 'success_metrics'
  | 'escalations'
  | 'savings_time'
  | 'savings_money'
  | 'add_to_cart';

export type SectionType =
  | 'summary'
  | 'detailed_analysis'
  | 'question_handling'
  | 'savings'
  | 'cart_metrics';

export interface ChartPreference {
  id?: string;
  organization_id: string;
  chart_type: ChartType;
  is_visible: boolean;
  display_order?: number;
}

type ChartPreferences = {
  [key in ChartType]?: boolean;
};

type SectionPreferences = {
  [key in SectionType]?: boolean;
};

export const useChartPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ChartPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Define which charts belong to which sections
  const chartToSectionMap: Record<ChartType, SectionType> = {
    'total_messages': 'summary',
    'users_over_time': 'detailed_analysis',
    'sessions_over_time': 'detailed_analysis',
    'messages_over_time': 'detailed_analysis',
    'topics': 'detailed_analysis',
    'feedback_pie': 'question_handling',
    'thumbs_up': 'summary',
    'success_vs_fallback': 'question_handling',
    'success_metrics': 'summary',
    'escalations': 'question_handling',
    'savings_time': 'savings',
    'savings_money': 'savings',
    'add_to_cart': 'cart_metrics'
  };

  const isChartVisible = (chartType: ChartType): boolean => {
    if (isLoading) return true; // Default to showing all charts while loading
    const chartPreference = preferences.find(p => p.chart_type === chartType);
    return chartPreference !== undefined ? chartPreference.is_visible : true;
  };

  const isSectionVisible = (sectionType: SectionType): boolean => {
    if (isLoading) return true; // Default to showing all sections while loading
    
    // A section is visible if at least one of its charts is visible
    return Object.entries(chartToSectionMap).some(([chartType, section]) => {
      return section === sectionType && isChartVisible(chartType as ChartType);
    });
  };

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user?.organization_id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('statistics_preferences')
          .select('*')
          .eq('organization_id', user.organization_id);

        if (error) {
          console.error("Failed to fetch chart preferences:", error);
          toast.error("Failed to load chart preferences.");
        }

        if (data) {
          setPreferences(data as ChartPreference[]);
        }
      } catch (error) {
        console.error("Error fetching chart preferences:", error);
        toast.error("Error loading chart preferences.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user?.organization_id]);

  return {
    preferences,
    isChartVisible,
    isSectionVisible,
    isLoading
  };
};
