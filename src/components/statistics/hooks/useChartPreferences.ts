
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChartPreference {
  id: string;
  chart_type: string;
  is_visible: boolean;
  display_order: number;
  organization_id: string;
}

export const useChartPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ChartPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  const isChartVisible = (chartType: string): boolean => {
    const preference = preferences.find(p => p.chart_type === chartType);
    return preference ? preference.is_visible : true; // Default to visible if preference not found
  };

  return {
    preferences,
    isLoading,
    error,
    isChartVisible
  };
};
