import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DialogCache = Record<string, any[]>;

interface UseDialogPreloaderProps {
  organizationId: string | undefined;
}

export const useDialogPreloader = ({ 
  organizationId
}: UseDialogPreloaderProps) => {
  // Use ref for cache to avoid stale closures
  const dialogCacheRef = useRef<DialogCache>({});
  const [cacheVersion, setCacheVersion] = useState(0);
  const [preloadedConversations, setPreloadedConversations] = useState<Set<string>>(new Set());
  const [isPreloading, setIsPreloading] = useState(false);
  const pendingQueue = useRef<Set<string>>(new Set());
  const processingRef = useRef<boolean>(false);
  const lastRequestTime = useRef<number>(0);
  const queueTimer = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Process the queue of conversations to preload
  const processQueue = useCallback(async () => {
    if (processingRef.current || pendingQueue.current.size === 0 || !isMountedRef.current) return;
    
    processingRef.current = true;
    
    try {
      // Rate limiting - ensure at least 300ms between requests
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime.current;
      
      if (timeSinceLastRequest < 300) {
        await new Promise(resolve => setTimeout(resolve, 300 - timeSinceLastRequest));
      }
      
      if (!isMountedRef.current) return;
      
      const nextId = pendingQueue.current.values().next().value;
      if (!nextId) {
        processingRef.current = false;
        return;
      }
      pendingQueue.current.delete(nextId);
      
      // If already cached, skip
      if (dialogCacheRef.current[nextId]) {
        processingRef.current = false;
        if (pendingQueue.current.size > 0 && isMountedRef.current) {
          queueTimer.current = window.setTimeout(processQueue, 0);
        }
        return;
      }
      
      setIsPreloading(true);

      const { data, error } = await supabase.functions.invoke('get-transcript', {
        body: { transcriptId: nextId }
      });

      if (error) throw error;
      if (!isMountedRef.current) return;

      const historyData = data?.history || [];
      
      dialogCacheRef.current[nextId] = historyData;
      setCacheVersion(v => v + 1);
      
      setPreloadedConversations(prev => {
        const updated = new Set(prev);
        updated.add(nextId);
        return updated;
      });
      
      lastRequestTime.current = Date.now();
      
    } catch (error) {
      console.error('Error preloading dialog:', error);
    } finally {
      processingRef.current = false;
      
      if (pendingQueue.current.size > 0 && isMountedRef.current) {
        queueTimer.current = window.setTimeout(processQueue, 50);
      } else {
        setIsPreloading(false);
      }
    }
  }, []);

  // Add conversations to preloading queue - simplified, no cleanup
  const preloadConversations = useCallback((conversationIds: string[]) => {
    // Add to pending queue only if not already cached
    conversationIds.forEach(id => {
      if (!dialogCacheRef.current[id] && !pendingQueue.current.has(id)) {
        pendingQueue.current.add(id);
      }
    });
    
    // Start processing if not already running
    if (!processingRef.current && pendingQueue.current.size > 0) {
      queueTimer.current = window.setTimeout(processQueue, 0);
    }
  }, [processQueue]);

  // Get dialog from cache
  const getCachedDialog = useCallback((conversationId: string) => {
    return dialogCacheRef.current[conversationId] || undefined;
  }, []);

  // Check if a conversation is preloaded
  const isConversationPreloaded = useCallback((conversationId: string) => {
    return preloadedConversations.has(conversationId);
  }, [preloadedConversations]);

  // Search within dialog content
  const searchInDialogContent = useCallback((searchTerm: string, conversationId: string) => {
    const cached = dialogCacheRef.current[conversationId];
    if (!cached) return false;
    
    const searchLower = searchTerm.toLowerCase();
    
    return cached.some(msg => {
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
  }, []);

  // Clean up on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      if (queueTimer.current !== null) {
        window.clearTimeout(queueTimer.current);
      }
    };
  }, []);

  return {
    dialogCache: dialogCacheRef.current,
    preloadConversations,
    getCachedDialog,
    isConversationPreloaded,
    isPreloading,
    searchInDialogContent
  };
};
