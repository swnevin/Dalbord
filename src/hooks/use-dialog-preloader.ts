
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
  const cacheRef = useRef<DialogCache>({});
  
  // Sync the state to the ref
  useEffect(() => {
    cacheRef.current = dialogCache;
  }, [dialogCache]);
  
  useEffect(() => {
    console.log("DialogPreloader: organization ID =", organizationId);
  }, [organizationId]);

  const cleanupCache = useCallback(() => {
    if (Object.keys(dialogCache).length <= maxCacheSize) return;
    
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

  const processQueue = useCallback(async () => {
    if (!organizationId || processingRef.current || pendingQueue.current.size === 0) return;
    
    processingRef.current = true;
    
    try {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime.current;
      
      if (timeSinceLastRequest < 300) {
        await new Promise(resolve => setTimeout(resolve, 300 - timeSinceLastRequest));
      }
      
      const nextId = pendingQueue.current.values().next().value;
      pendingQueue.current.delete(nextId);
      
      // Skip if already cached
      if (cacheRef.current[nextId]) {
        console.log(`Conversation ${nextId} already cached, skipping`);
        processingRef.current = false;
        queueTimer.current = window.setTimeout(processQueue, 0);
        return;
      }
      
      setIsPreloading(true);
      
      abortControllerRef.current = new AbortController();
      
      console.log(`Preloading dialog for conversation ${nextId} with org ID ${organizationId}`);
      
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key, voiceflow_project_id')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;
      if (!org.voiceflow_api_key || !org.voiceflow_project_id) {
        throw new Error('Mangler Voiceflow-legitimasjon');
      }

      const response = await fetch(
        `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}/${nextId}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: org.voiceflow_api_key,
          },
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok) throw new Error('Kunne ikke laste inn samtale');

      const data = await response.json();
      
      const dataWithTimestamp = data.map((item: any) => ({
        ...item,
        accessedAt: Date.now()
      }));
      
      console.log(`Successfully preloaded dialog for conversation ${nextId}`);
      
      setDialogCache(prev => {
        const updated = {...prev, [nextId]: dataWithTimestamp};
        cacheRef.current = updated;
        return updated;
      });
      
      setPreloadedConversations(prev => {
        const updated = new Set(prev);
        updated.add(nextId);
        return updated;
      });
      
      lastRequestTime.current = Date.now();
      
    } catch (error) {
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
  }, [organizationId]);

  const preloadConversations = useCallback((conversationIds: string[]) => {
    if (!organizationId) {
      console.warn("Cannot preload conversations: missing organization ID");
      return;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (queueTimer.current !== null) {
      window.clearTimeout(queueTimer.current);
      queueTimer.current = null;
    }
    
    console.log(`Adding ${conversationIds.length} conversations to preload queue`);
    
    conversationIds.forEach(id => {
      if (!cacheRef.current[id] && !pendingQueue.current.has(id)) {
        pendingQueue.current.add(id);
      }
    });
    
    queueTimer.current = window.setTimeout(processQueue, 0);
    
    cleanupCache();
  }, [processQueue, cleanupCache, organizationId]);

  const getCachedDialog = useCallback((conversationId: string) => {
    console.log(`Checking cache for dialog ${conversationId}`, Object.keys(cacheRef.current));
    
    if (!cacheRef.current[conversationId]) {
      console.log(`Dialog ${conversationId} not found in cache`);
      return undefined;
    }
    
    console.log(`Dialog ${conversationId} found in cache`);
    
    // Update the access timestamp
    const updatedDialog = cacheRef.current[conversationId].map((item: any) => ({
      ...item,
      accessedAt: Date.now()
    }));
    
    // Update the cache with the new timestamps
    setDialogCache(prev => {
      const updated = {...prev, [conversationId]: updatedDialog};
      cacheRef.current = updated;
      return updated;
    });
    
    return updatedDialog;
  }, []);

  const isConversationPreloaded = useCallback((conversationId: string) => {
    const isPreloaded = preloadedConversations.has(conversationId);
    console.log(`Is conversation ${conversationId} preloaded?`, isPreloaded);
    return isPreloaded;
  }, [preloadedConversations]);

  const searchInDialogContent = useCallback((searchTerm: string, conversationId: string) => {
    if (!cacheRef.current[conversationId]) return false;
    
    const searchLower = searchTerm.toLowerCase();
    
    return cacheRef.current[conversationId].some(msg => {
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

  useEffect(() => {
    return () => {
      console.log("Cleaning up dialog preloader resources");
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
