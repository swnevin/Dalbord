
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DialogCache {
  [conversationId: string]: {
    dialog: any[];
    loadedAt: number;
    status: "loading" | "loaded" | "error";
  };
}

export function useDialogPreloader(
  conversations: any[],
  organizationId: string | undefined,
  itemsPerPage: number
) {
  const [dialogCache, setDialogCache] = useState<DialogCache>({});
  const [currentlyLoading, setCurrentlyLoading] = useState<string | null>(null);
  const abortControllerRef = useRef<Record<string, AbortController>>({});
  const preloadQueueRef = useRef<string[]>([]);

  const clearCache = useCallback(() => {
    setDialogCache({});
    preloadQueueRef.current = [];
    
    // Abort all pending requests
    Object.values(abortControllerRef.current).forEach(controller => {
      controller.abort();
    });
    abortControllerRef.current = {};
  }, []);

  const fetchDialog = useCallback(async (conversationId: string, prioritize = false) => {
    if (!organizationId) return null;
    
    // If already loading or loaded, don't fetch again
    if (dialogCache[conversationId] && dialogCache[conversationId].status !== "error") {
      return dialogCache[conversationId].dialog;
    }
    
    // Set loading state
    setDialogCache(prev => ({
      ...prev,
      [conversationId]: {
        dialog: [],
        loadedAt: Date.now(),
        status: "loading",
      }
    }));
    
    // Create abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current[conversationId] = controller;
    
    try {
      setCurrentlyLoading(conversationId);
      
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key, voiceflow_project_id')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;
      if (!org.voiceflow_api_key || !org.voiceflow_project_id) {
        throw new Error('Missing Voiceflow credentials');
      }

      const response = await fetch(
        `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}/${conversationId}`,
        {
          signal: controller.signal,
          headers: {
            accept: 'application/json',
            Authorization: org.voiceflow_api_key,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch dialog');

      const data = await response.json();
      
      // Update cache with loaded dialog
      setDialogCache(prev => ({
        ...prev,
        [conversationId]: {
          dialog: data,
          loadedAt: Date.now(),
          status: "loaded",
        }
      }));
      
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was aborted, do nothing
        return null;
      }
      
      console.error('Error fetching dialog:', error);
      
      // Update cache with error state
      setDialogCache(prev => ({
        ...prev,
        [conversationId]: {
          dialog: [],
          loadedAt: Date.now(),
          status: "error",
        }
      }));
      
      return null;
    } finally {
      setCurrentlyLoading(null);
      delete abortControllerRef.current[conversationId];
    }
  }, [organizationId, dialogCache]);

  // Function to preload multiple dialogs in order
  const preloadDialogs = useCallback(async () => {
    if (!organizationId || preloadQueueRef.current.length === 0) return;
    
    // Get next conversation ID from queue
    const nextId = preloadQueueRef.current.shift();
    if (!nextId) return;
    
    // Skip if already loaded
    if (dialogCache[nextId] && dialogCache[nextId].status === "loaded") {
      // Continue with next in queue
      preloadDialogs();
      return;
    }
    
    // Fetch dialog
    await fetchDialog(nextId);
    
    // Continue with next in queue
    preloadDialogs();
  }, [organizationId, fetchDialog, dialogCache]);

  // Set up preload queue when conversations change
  useEffect(() => {
    if (!conversations?.length) return;
    
    // Queue up all visible conversations for preloading
    const conversationIds = conversations.slice(0, itemsPerPage).map(c => c._id);
    
    // Filter out already loaded conversations
    const notLoadedIds = conversationIds.filter(
      id => !dialogCache[id] || dialogCache[id].status !== "loaded"
    );
    
    preloadQueueRef.current = notLoadedIds;
    
    // Start preloading if not already in progress
    if (!currentlyLoading) {
      preloadDialogs();
    }
    
    // Cleanup function to abort any pending requests when conversations change
    return () => {
      Object.values(abortControllerRef.current).forEach(controller => {
        controller.abort();
      });
    };
  }, [conversations, itemsPerPage, dialogCache, currentlyLoading, preloadDialogs]);

  return {
    dialogCache,
    fetchDialog,
    clearCache,
    currentlyLoading,
  };
}
