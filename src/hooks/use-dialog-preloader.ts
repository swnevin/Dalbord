
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DialogCache = Record<string, any[]>;

interface UseDialogPreloaderProps {
  organizationId: string | undefined;
  maxCacheSize?: number;
}

export const useDialogPreloader = ({ 
  organizationId, 
  maxCacheSize = 25
}: UseDialogPreloaderProps) => {
  const [dialogCache, setDialogCache] = useState<DialogCache>({});
  const [preloadedConversations, setPreloadedConversations] = useState<Set<string>>(new Set());
  const [isPreloading, setIsPreloading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingQueue = useRef<Set<string>>(new Set());
  const processingRef = useRef<boolean>(false);
  const lastRequestTime = useRef<number>(0);
  const queueTimer = useRef<number | null>(null);
  
  // Clean up cache when it exceeds maximum size
  const cleanupCache = useCallback(() => {
    if (Object.keys(dialogCache).length <= maxCacheSize) return;
    
    // Simple LRU implementation - remove oldest entries
    const entries = Object.entries(dialogCache);
    const sortedEntries = entries.sort((a, b) => {
      const aAccessed = a[1][0]?.accessedAt || 0;
      const bAccessed = b[1][0]?.accessedAt || 0;
      return aAccessed - bAccessed;
    });
    
    const toRemove = sortedEntries.slice(0, entries.length - maxCacheSize);
    const newCache = { ...dialogCache };
    
    toRemove.forEach(([key]) => {
      delete newCache[key];
      setPreloadedConversations(prev => {
        const updated = new Set(prev);
        updated.delete(key);
        return updated;
      });
    });
    
    setDialogCache(newCache);
  }, [dialogCache, maxCacheSize]);

  // Process the queue of conversations to preload
  const processQueue = useCallback(async () => {
    if (!organizationId || processingRef.current || pendingQueue.current.size === 0) return;
    
    processingRef.current = true;
    
    // Create AbortController FIRST, before any async operations
    const localAbortController = new AbortController();
    abortControllerRef.current = localAbortController;
    
    try {
      // Rate limiting - ensure at least 300ms between requests
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime.current;
      
      if (timeSinceLastRequest < 300) {
        await new Promise(resolve => setTimeout(resolve, 300 - timeSinceLastRequest));
      }
      
      // Check if we were aborted during the wait
      if (localAbortController.signal.aborted) {
        return;
      }
      
      const nextId = pendingQueue.current.values().next().value;
      if (!nextId) {
        return;
      }
      pendingQueue.current.delete(nextId);
      
      // If already cached, skip
      if (dialogCache[nextId]) {
        processingRef.current = false;
        queueTimer.current = window.setTimeout(processQueue, 0);
        return;
      }
      
      setIsPreloading(true);
      
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key, voiceflow_project_id')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;
      if (!org.voiceflow_api_key || !org.voiceflow_project_id) {
        throw new Error('Mangler Voiceflow-legitimasjon');
      }
      
      // Check again if aborted before making fetch request
      if (localAbortController.signal.aborted) {
        return;
      }

      const response = await fetch(
        `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}/${nextId}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: org.voiceflow_api_key,
          },
          signal: localAbortController.signal  // Use local reference, not ref
        }
      );

      if (!response.ok) throw new Error('Kunne ikke laste inn samtale');

      const data = await response.json();
      
      // Add accessedAt timestamp for LRU cache
      const dataWithTimestamp = data.map((item: any) => ({
        ...item,
        accessedAt: Date.now()
      }));
      
      setDialogCache(prev => ({
        ...prev,
        [nextId]: dataWithTimestamp
      }));
      
      setPreloadedConversations(prev => {
        const updated = new Set(prev);
        updated.add(nextId);
        return updated;
      });
      
      lastRequestTime.current = Date.now();
      
    } catch (error) {
      // Ignore aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Preloading request aborted');
      } else {
        console.error('Error preloading dialog:', error);
      }
    } finally {
      processingRef.current = false;
      
      if (pendingQueue.current.size > 0) {
        queueTimer.current = window.setTimeout(processQueue, 50);
      } else {
        setIsPreloading(false);
      }
    }
  }, [organizationId, dialogCache]);

  // Add conversations to preloading queue
  const preloadConversations = useCallback((conversationIds: string[]) => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Clear existing timer if any
    if (queueTimer.current !== null) {
      window.clearTimeout(queueTimer.current);
      queueTimer.current = null;
    }
    
    // Add to pending queue
    conversationIds.forEach(id => {
      if (!dialogCache[id] && !pendingQueue.current.has(id)) {
        pendingQueue.current.add(id);
      }
    });
    
    // Start processing queue
    queueTimer.current = window.setTimeout(processQueue, 0);
    
    // Clean up cache if needed
    cleanupCache();
  }, [processQueue, dialogCache, cleanupCache]);

  // Get dialog from cache or return undefined if not cached
  // IMPORTANT: This function is read-only - it does NOT update state
  const getCachedDialog = useCallback((conversationId: string) => {
    return dialogCache[conversationId] || undefined;
  }, [dialogCache]);

  // Check if a conversation is preloaded
  const isConversationPreloaded = useCallback((conversationId: string) => {
    return preloadedConversations.has(conversationId);
  }, [preloadedConversations]);

  // Search within dialog content
  const searchInDialogContent = useCallback((searchTerm: string, conversationId: string) => {
    if (!dialogCache[conversationId]) return false;
    
    const searchLower = searchTerm.toLowerCase();
    
    return dialogCache[conversationId].some(msg => {
      if (msg.type === 'text' && msg.payload?.payload?.message) {
        return msg.payload.payload.message.toLowerCase().includes(searchLower);
      }
      if (msg.type === 'request' && 
         (msg.payload?.payload?.query || msg.payload?.payload?.label)) {
        const text = (msg.payload.payload.query || msg.payload.payload.label || '').toLowerCase();
        return text.includes(searchLower);
      }
      return false;
    });
  }, [dialogCache]);

  // Clean up aborted requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (queueTimer.current !== null) {
        window.clearTimeout(queueTimer.current);
      }
    };
  }, []);

  return {
    dialogCache,
    preloadConversations,
    getCachedDialog,
    isConversationPreloaded,
    isPreloading,
    searchInDialogContent
  };
};
