
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DialogCache {
  [conversationId: string]: any[];
}

interface DialogContentCache {
  [conversationId: string]: string;
}

interface UseDialogPreloaderProps {
  organizationId?: string;
}

export const useDialogPreloader = ({ organizationId }: UseDialogPreloaderProps = {}) => {
  const [dialogCache, setDialogCache] = useState<DialogCache>({});
  const [dialogContentCache, setDialogContentCache] = useState<DialogContentCache>({});
  const [failedPreloads, setFailedPreloads] = useState<Set<string>>(new Set());

  const getCachedDialog = useCallback((conversationId: string) => {
    return dialogCache[conversationId];
  }, [dialogCache]);

  const isConversationPreloaded = useCallback((conversationId: string) => {
    return Boolean(dialogCache[conversationId]) || failedPreloads.has(conversationId);
  }, [dialogCache, failedPreloads]);

  const preloadConversations = useCallback(async (conversationIds: string[]) => {
    if (!organizationId) return;
    
    // Filter out already preloaded or failed conversations
    const idsToPreload = conversationIds.filter(id => 
      !dialogCache[id] && !failedPreloads.has(id)
    );
    
    if (idsToPreload.length === 0) return;

    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key, voiceflow_project_id')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;
      if (!org.voiceflow_api_key || !org.voiceflow_project_id) {
        console.error('Missing Voiceflow credentials');
        return;
      }

      // Use Promise.allSettled to fetch all dialogs in parallel but handle failures individually
      const preloadPromises = idsToPreload.map(async (id) => {
        try {
          const response = await fetch(
            `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}/${id}`,
            {
              headers: {
                accept: 'application/json',
                Authorization: org.voiceflow_api_key,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch dialog for ${id}: ${response.status}`);
          }

          const dialogData = await response.json();
          
          return { id, dialog: dialogData };
        } catch (error) {
          console.error(`Error preloading dialog for ${id}:`, error);
          return { id, error };
        }
      });

      const results = await Promise.allSettled(preloadPromises);
      
      const newCache = { ...dialogCache };
      const newContentCache = { ...dialogContentCache };
      const newFailedPreloads = new Set(failedPreloads);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { id, dialog, error } = result.value;
          
          if (dialog) {
            newCache[id] = dialog;
            
            // Extract and store content for search
            const content = dialog
              .filter((item: any) => item.payload?.message || item.payload?.text)
              .map((item: any) => item.payload?.message || item.payload?.text)
              .join(' ')
              .toLowerCase();
              
            newContentCache[id] = content;
          } else if (error) {
            newFailedPreloads.add(id);
          }
        }
      });
      
      setDialogCache(newCache);
      setDialogContentCache(newContentCache);
      setFailedPreloads(newFailedPreloads);
    } catch (error) {
      console.error('Error fetching organization data:', error);
    }
  }, [dialogCache, dialogContentCache, failedPreloads, organizationId]);

  const searchInDialogContent = useCallback((searchTerm: string, conversationId: string) => {
    const content = dialogContentCache[conversationId];
    if (!content) return false;
    
    return content.includes(searchTerm.toLowerCase());
  }, [dialogContentCache]);

  // Reset caches when organization changes
  useEffect(() => {
    setDialogCache({});
    setDialogContentCache({});
    setFailedPreloads(new Set());
  }, [organizationId]);

  return {
    dialogCache,
    preloadConversations,
    getCachedDialog,
    isConversationPreloaded,
    searchInDialogContent
  };
};
