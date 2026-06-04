import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import KnowledgeBase from "@/components/KnowledgeBase";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMinimumLoading } from "@/hooks/use-minimum-loading";
import { toast } from "sonner";
import { ConversationList } from "@/components/conversations/ConversationList";
import { ConversationDialog } from "@/components/conversations/ConversationDialog";
import { DeleteDialog } from "@/components/conversations/DeleteDialog";
import Statistics from "@/components/statistics/Statistics";
import { Home } from "@/components/home/Home";
import { AdministratorTab } from "@/components/administrator/AdministratorTab";
import { useDialogPreloader } from "@/hooks/use-dialog-preloader";

// New Analytics API response structure
interface VoiceflowTranscript {
  id: string;           // New API uses 'id' instead of '_id'
  _id?: string;         // Keep for backward compatibility
  sessionID: string;
  projectID: string;
  createdAt: string;
  updatedAt: string;
  properties?: Array<{
    name: string;
    value: string;
  }>;
  // Legacy fields we map for UI
  name?: string;
  device?: string;
  reportTags?: string[];
}

type FilterType = "all" | "approved" | "saved";

// Helper to get transcript ID (supports both old and new API)
const getTranscriptId = (conv: VoiceflowTranscript): string => conv.id || conv._id || '';

const ClientDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const { user, previewUser, isInPreviewMode } = useAuth();
  const [conversations, setConversations] = useState<VoiceflowTranscript[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationsCollapsed, setConversationsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dialog, setDialog] = useState<any[]>([]);
  const [isLoadingDialog, setIsLoadingDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [searchInContent, setSearchInContent] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [preloadingTimerRef, setPreloadingTimerRef] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalLoaded, setTotalLoaded] = useState(0);
  const [dateFilter, setDateFilter] = useState<{ from?: Date; to?: Date }>({});

  const getEffectiveOrgId = useCallback(() => {
    return isInPreviewMode && previewUser 
      ? previewUser.organization_id 
      : user?.organization_id;
  }, [isInPreviewMode, previewUser, user]);

  const {
    dialogCache,
    preloadConversations,
    getCachedDialog,
    isConversationPreloaded,
    searchInDialogContent
  } = useDialogPreloader({
    organizationId: getEffectiveOrgId()
  });

  const toggleTag = async (conversationId: string, tag: "system.saved" | "system.reviewed") => {
    try {
      // Convert tag format: "system.saved" -> "saved"
      const tagName = tag.replace('system.', '') as 'saved' | 'reviewed';
      
      const { data, error } = await supabase.functions.invoke('toggle-conversation-tag', {
        body: { transcriptId: conversationId, tag: tagName }
      });

      if (error) {
        console.error('Error toggling tag:', error);
        toast.error('Kunne ikke oppdatere markering');
        return;
      }

      // Update local state based on action
      setConversations(prevConversations => 
        prevConversations.map(conv => {
          if (getTranscriptId(conv) === conversationId) {
            const currentTags = conv.reportTags || [];
            const newTags = data.action === 'added'
              ? [...currentTags, tag]
              : currentTags.filter(t => t !== tag);
            return { ...conv, reportTags: newTags };
          }
          return conv;
        })
      );

      toast.success(data.action === 'added' ? 'Samtale markert' : 'Markering fjernet');
    } catch (error) {
      console.error('Error updating conversation tag:', error);
      toast.error('Kunne ikke oppdatere markering');
    }
  };

  const handleToggleSearchInContent = useCallback((value: boolean) => {
    setSearchInContent(value);
  }, []);

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const filteredConversations = useCallback(() => {
    return conversations.filter(conv => {
      if (activeFilter === "saved" && !conv.reportTags?.includes("system.saved")) return false;
      if (activeFilter === "approved" && !conv.reportTags?.includes("system.reviewed")) return false;
      
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      
      // Enhanced date search - check for partial matches in day, month, year
      const date = new Date(conv.updatedAt);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      
      const dateFormatted = `${day}.${month}.${year}`;
      const timeFormatted = `${hour}:${minute}`;
      
      const nameMatch = (conv.name || "Ukjent bruker").toLowerCase().includes(searchLower);
      const dateMatch = dateFormatted.includes(searchLower) || 
                         `${day}.${month}`.includes(searchLower) ||
                         `${month}.${year}`.includes(searchLower) ||
                         year.includes(searchLower) ||
                         timeFormatted.includes(searchLower) ||
                         conv.updatedAt.toLowerCase().includes(searchLower);
      const deviceMatch = (conv.device || "").toLowerCase().includes(searchLower);
      
      const convId = getTranscriptId(conv);
      if (searchInContent && isConversationPreloaded(convId)) {
        return nameMatch || dateMatch || deviceMatch || 
               searchInDialogContent(searchTerm, convId);
      }
      
      return nameMatch || dateMatch || deviceMatch;
    });
  }, [conversations, searchTerm, activeFilter, searchInContent, isConversationPreloaded, searchInDialogContent]);

  const getPaginatedConversations = useCallback((page: number, itemsPerPage: number) => {
    const filtered = filteredConversations();
    const startIndex = (page - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredConversations]);

  const handleSelectConversation = useCallback((conversationId: string) => {
    // Reset dialog state for new conversation
    setDialog([]);
    setSelectedConversation(conversationId);
    
    // Check cache first
    const cachedDialog = getCachedDialog(conversationId);
    if (cachedDialog !== undefined) {
      setDialog(cachedDialog);
      setIsLoadingDialog(false);
    } else {
      setIsLoadingDialog(true);
    }
    
    // Clear any existing preload timer
    if (preloadingTimerRef) {
      clearTimeout(preloadingTimerRef);
    }
    
    // Schedule preloading of nearby conversations
    const timer = setTimeout(() => {
      const visibleConversations = getPaginatedConversations(currentPage, itemsPerPage);
      if (visibleConversations.length > 0) {
        const conversationIds = visibleConversations
          .map(conv => getTranscriptId(conv))
          .filter(id => id && id !== conversationId);
          
        if (conversationIds.length > 0) {
          preloadConversations(conversationIds);
        }
      }
    }, 1000);
    
    setPreloadingTimerRef(timer);
  }, [getCachedDialog, preloadConversations, currentPage, itemsPerPage, getPaginatedConversations, preloadingTimerRef]);

  const handleDeleteClick = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;
    
    const effectiveOrgId = getEffectiveOrgId();
    if (!effectiveOrgId) return;

    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key, voiceflow_project_id')
        .eq('id', effectiveOrgId)
        .single();

      if (orgError) throw orgError;
      if (!org.voiceflow_api_key || !org.voiceflow_project_id) {
        throw new Error('Mangler Voiceflow-legitimasjon');
      }

      const response = await fetch(
        `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}/${conversationToDelete}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: org.voiceflow_api_key,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Kunne ikke slette samtalen');
      }

      setConversations(prevConversations => 
        prevConversations.filter(conv => getTranscriptId(conv) !== conversationToDelete)
      );
      
      toast.success('Samtalen ble slettet');
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast.error(error.message || 'Kunne ikke slette samtalen');
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const loadMoreConversations = async () => {
    if (isLoadingMore || !hasMoreConversations) return;
    
    setIsLoadingMore(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-transcripts', {
        body: { 
          take: 100, 
          skip: totalLoaded,
          ...(dateFilter.from && { startDate: dateFilter.from.toISOString() }),
          ...(dateFilter.to && { endDate: dateFilter.to.toISOString() })
        }
      });

      if (error) throw error;

      const newTranscripts = (data?.transcripts || []).map((t: any) => ({
        ...t,
        _id: t.id,
        name: t.properties?.find((p: any) => p.name === 'user_name')?.value || 'Ukjent bruker',
        device: t.properties?.find((p: any) => p.name === 'device')?.value || '',
        reportTags: []
      }));

      setConversations(prev => [...prev, ...newTranscripts]);
      setTotalLoaded(prev => prev + newTranscripts.length);
      setHasMoreConversations(data?.hasMore || false);
      toast.success(`Lastet ${newTranscripts.length} flere samtaler`);
    } catch (error) {
      console.error('Error loading more conversations:', error);
      toast.error('Kunne ikke laste flere samtaler');
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (activeTab === "conversations") {
      const visibleConversations = getPaginatedConversations(currentPage, itemsPerPage);
      if (visibleConversations.length > 0) {
        // Only preload the first 25 conversations
        const conversationIds = visibleConversations
          .slice(0, 25)
          .map(conv => getTranscriptId(conv))
          .filter(Boolean);
        preloadConversations(conversationIds);
      }
    }
    
    return () => {
      if (preloadingTimerRef) {
        clearTimeout(preloadingTimerRef);
        setPreloadingTimerRef(null);
      }
    };
  }, [activeTab, currentPage, itemsPerPage, getPaginatedConversations, preloadConversations, preloadingTimerRef]);

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);

      try {
        // Fetch transcripts and tags in parallel
        const [transcriptsResult, tagsResult] = await Promise.all([
          supabase.functions.invoke('get-transcripts', {
            body: { 
              take: 100, 
              skip: 0,
              ...(dateFilter.from && { startDate: dateFilter.from.toISOString() }),
              ...(dateFilter.to && { endDate: dateFilter.to.toISOString() })
            }
          }),
          supabase.from('conversation_tags').select('transcript_id, tag')
        ]);

        if (transcriptsResult.error) throw transcriptsResult.error;

        // Create a map of transcript_id -> tags for quick lookup
        const tagsMap = new Map<string, string[]>();
        if (tagsResult.data) {
          for (const tagRow of tagsResult.data) {
            const existing = tagsMap.get(tagRow.transcript_id) || [];
            existing.push(`system.${tagRow.tag}`);
            tagsMap.set(tagRow.transcript_id, existing);
          }
        }

        // Map transcripts fra ny API-format and merge with local tags
        const transcripts = (transcriptsResult.data?.transcripts || []).map((t: any) => ({
          ...t,
          _id: t.id, // Map 'id' til '_id' for backward compatibility
          name: t.properties?.find((p: any) => p.name === 'user_name')?.value || 'Ukjent bruker',
          device: t.properties?.find((p: any) => p.name === 'device')?.value || '',
          reportTags: tagsMap.get(t.id) || []
        }));

        setConversations(transcripts);
        setTotalLoaded(transcripts.length);
        setHasMoreConversations(transcriptsResult.data?.hasMore || false);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast.error('Kunne ikke laste samtaler');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [dateFilter]);

  // Fetch dialog when selectedConversation changes and not already loaded
  useEffect(() => {
    const fetchDialog = async () => {
      if (!selectedConversation) return;
      
      // Skip if already loading or have data
      if (dialog.length > 0) return;
      if (!isLoadingDialog) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('get-transcript', {
          body: { transcriptId: selectedConversation }
        });

        if (error) throw error;

        setDialog(data?.history || []);
      } catch (error) {
        console.error('Error fetching dialog:', error);
        toast.error('Kunne ikke laste inn samtale');
        setDialog([]);
      } finally {
        setIsLoadingDialog(false);
      }
    };

    fetchDialog();
  }, [selectedConversation, isLoadingDialog, dialog.length]);

  useEffect(() => {
    return () => {
      if (preloadingTimerRef) {
        clearTimeout(preloadingTimerRef);
      }
    };
  }, [preloadingTimerRef]);

  const showLoader = useMinimumLoading(isLoading);
  const showDialogLoader = useMinimumLoading(isLoadingDialog);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Topbar />
      <Sidebar 
        role="client" 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div className={`flex-1 overflow-auto pt-14 transition-all duration-300 ${sidebarCollapsed ? 'ml-12' : 'ml-48'}`}>
        {activeTab === "home" && <Home />}
        {activeTab === "conversations" && (
          <div className="flex flex-1">
            <ConversationList
              conversations={filteredConversations()}
              collapsed={conversationsCollapsed}
              selectedId={selectedConversation}
              isLoading={showLoader}
              onCollapsedChange={setConversationsCollapsed}
              onConversationSelect={handleSelectConversation}
              onToggleTag={toggleTag}
              onDeleteClick={handleDeleteClick}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              isPreloaded={isConversationPreloaded}
              searchInContent={searchInContent}
              onToggleSearchInContent={handleToggleSearchInContent}
              searchTerm={searchTerm}
              onSearchTermChange={handleSearchTermChange}
              getPaginatedConversations={getPaginatedConversations}
              hasMore={hasMoreConversations}
              onLoadMore={loadMoreConversations}
              isLoadingMore={isLoadingMore}
              totalLoaded={totalLoaded}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
            />
            <ConversationDialog
              isLoading={showDialogLoader}
              selectedConversation={selectedConversation}
              dialog={dialog}
            />
          </div>
        )}
        {activeTab === "knowledge" && (
          <KnowledgeBase />
        )}
        {activeTab === "statistics" && <Statistics />}
        {activeTab === "administrator" && <AdministratorTab />}
      </div>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default ClientDashboard;
