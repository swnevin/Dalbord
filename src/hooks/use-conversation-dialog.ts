
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDialogPreloader } from "@/hooks/use-dialog-preloader";

export const useConversationDialog = (selectedConversationId: string | null) => {
  const { user } = useAuth();
  const [dialog, setDialog] = useState<any[]>([]);
  const [isLoadingDialog, setIsLoadingDialog] = useState(false);
  
  const {
    getCachedDialog,
    preloadConversations,
    isConversationPreloaded
  } = useDialogPreloader({
    organizationId: user?.organization_id
  });

  const fetchDialogFromAPI = useCallback(async (conversationId: string) => {
    console.log(`Fetching dialog for conversation ${conversationId} from API`);
    
    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key, voiceflow_project_id')
        .eq('id', user?.organization_id)
        .single();

      if (orgError) throw orgError;
      if (!org?.voiceflow_api_key || !org?.voiceflow_project_id) {
        console.error('Missing Voiceflow credentials');
        throw new Error('Mangler Voiceflow-legitimasjon');
      }

      const response = await fetch(
        `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}/${conversationId}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: org.voiceflow_api_key,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch dialog');

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error fetching dialog:', error);
      throw error;
    }
  }, [user?.organization_id]);

  useEffect(() => {
    const loadDialog = async () => {
      if (!selectedConversationId || !user?.organization_id) return;
      
      setIsLoadingDialog(true);
      
      try {
        // First check if we have this dialog in cache
        const cachedDialog = getCachedDialog(selectedConversationId);
        
        if (cachedDialog) {
          console.log(`Using cached dialog for conversation ${selectedConversationId}`);
          setDialog(cachedDialog);
          setIsLoadingDialog(false);
          return;
        }
        
        // If not in cache, fetch from API
        const dialogData = await fetchDialogFromAPI(selectedConversationId);
        setDialog(dialogData);
        
        // After loading, update the preloaded data
        preloadConversations([selectedConversationId]);
      } catch (error) {
        console.error('Error loading dialog:', error);
        toast.error('Kunne ikke laste inn samtale');
        setDialog([]);
      } finally {
        setIsLoadingDialog(false);
      }
    };

    loadDialog();
  }, [selectedConversationId, user?.organization_id, getCachedDialog, preloadConversations, fetchDialogFromAPI]);

  return {
    dialog,
    isLoadingDialog
  };
};
