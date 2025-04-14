
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FallbackRequest {
  id: string;
  query: string;
  response: string;
  created_at: string;
  is_resolved: boolean;
}

export const useFallbackRequests = () => {
  const { user } = useAuth();
  const [fallbackRequests, setFallbackRequests] = useState<FallbackRequest[]>([]);
  const [resolvedRequests, setResolvedRequests] = useState<FallbackRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilteredResults, setShowFilteredResults] = useState(true);
  
  const fetchFallbackRequests = async () => {
    if (!user?.organization_id) return;
    
    try {
      setIsLoading(true);
      
      const { data: unresolvedData, error: unresolvedError } = await supabase
        .from('fallback_requests')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });
        
      if (unresolvedError) throw unresolvedError;
      
      const { data: resolvedData, error: resolvedError } = await supabase
        .from('fallback_requests')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('is_resolved', true)
        .order('created_at', { ascending: false });
        
      if (resolvedError) throw resolvedError;
      
      setFallbackRequests(unresolvedData || []);
      setResolvedRequests(resolvedData || []);
    } catch (error) {
      console.error('Error fetching fallback requests:', error);
      toast.error('Kunne ikke hente henvendelser til fallback');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFallbackRequests();
  }, [user?.organization_id]);
  
  const markAsResolved = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('fallback_requests')
        .update({ is_resolved: true })
        .eq('id', requestId);
        
      if (error) throw error;
      
      fetchFallbackRequests();
      toast.success('Henvendelse markert som løst');
      return true;
    } catch (error) {
      console.error('Error updating fallback request:', error);
      toast.error('Kunne ikke oppdatere henvendelsen');
      return false;
    }
  };

  return {
    fallbackRequests,
    resolvedRequests,
    isLoading,
    showFilteredResults,
    setShowFilteredResults,
    fetchFallbackRequests,
    markAsResolved
  };
};
