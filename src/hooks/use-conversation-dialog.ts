
import { useState, useEffect } from "react";
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

  useEffect(() => {
    const fetchDialog = async () => {
      if (!selectedConversationId || !user?.organization_id) return;
      
      // Check if the dialog is already cached
      const cachedDialog = getCachedDialog(selectedConversationId);
      if (cachedDialog) {
        console.log(`Using cached dialog for conversation ${selectedConversationId}`);
        setDialog(cachedDialog);
        return;
      }
      
      try {
        console.log(`Fetching dialog for conversation ${selectedConversationId}`);
        setIsLoadingDialog(true);
        
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('voiceflow_api_key, voiceflow_project_id')
          .eq('id', user.organization_id)
          .single();

        if (orgError) throw orgError;
        if (!org.voiceflow_api_key || !org.voiceflow_project_id) {
          console.error('Missing Voiceflow credentials');
          return;
        }

        const response = await fetch(
          `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}/${selectedConversationId}`,
          {
            headers: {
              accept: 'application/json',
              Authorization: org.voiceflow_api_key,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch dialog');

        const data = await response.json();
        setDialog(data);
        
        // After loading, update the preloaded data
        preloadConversations([selectedConversationId]);
      } catch (error) {
        console.error('Error fetching dialog:', error);
        toast.error('Kunne ikke laste inn samtale');
      } finally {
        setIsLoadingDialog(false);
      }
    };

    fetchDialog();
  }, [selectedConversationId, user?.organization_id, getCachedDialog, preloadConversations, isConversationPreloaded]);

  return {
    dialog,
    isLoadingDialog
  };
};
