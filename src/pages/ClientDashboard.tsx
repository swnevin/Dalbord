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

interface VoiceflowTranscript {
  _id: string;
  name: string;
  updatedAt: string;
  device: string;
  sessionID: string;
  reportTags: string[];
  user?: {
    name: string;
  };
}

type FilterType = "all" | "approved" | "saved";

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
  const [preloadingTimerRef, setPreloadingTimerRef] = useState<NodeJS.Timeout | null>(null);

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
        console.error('Missing Voiceflow credentials');
        return;
      }

      const conversation = conversations.find(c => c._id === conversationId);
      const hasTag = conversation?.reportTags?.includes(tag) ?? false;
      const method = hasTag ? "DELETE" : "PUT";
      
      const response = await fetch(
        `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}/${conversationId}/report_tag/${tag}`,
        {
          method,
          headers: {
            Authorization: org.voiceflow_api_key,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update conversation tag');
      }

      setConversations(prevConversations => 
        prevConversations.map(conv => {
          if (conv._id === conversationId) {
            const newTags = hasTag 
              ? conv.reportTags.filter(t => t !== tag)
              : [...(conv.reportTags || []), tag];
            return { ...conv, reportTags: newTags };
          }
          return conv;
        })
      );
    } catch (error) {
      console.error('Error updating conversation tag:', error);
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
      
      if (searchInContent && isConversationPreloaded(conv._id)) {
        return nameMatch || dateMatch || deviceMatch || 
               searchInDialogContent(searchTerm, conv._id);
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
    setSelectedConversation(conversationId);
    
    // Sjekk cache først - aksepter også tom array som gyldig cache
    const cachedDialog = getCachedDialog(conversationId);
    if (cachedDialog !== undefined) {
      setDialog(cachedDialog);
      setIsLoadingDialog(false);
    } else {
      // Sett loading state - dialog vil bli lastet i useEffect
      setDialog([]);
      setIsLoadingDialog(true);
    }
    
    if (preloadingTimerRef) {
      clearTimeout(preloadingTimerRef);
    }
    
    const timer = setTimeout(() => {
      const visibleConversations = getPaginatedConversations(currentPage, itemsPerPage);
      if (visibleConversations.length > 0) {
        const conversationIds = visibleConversations
          .map(conv => conv._id)
          .filter(id => id !== conversationId && !isConversationPreloaded(id));
          
        if (conversationIds.length > 0) {
          preloadConversations(conversationIds);
        }
      }
    }, 1000);
    
    setPreloadingTimerRef(timer);
  }, [
    getCachedDialog, 
    preloadConversations, 
    isConversationPreloaded,
    currentPage,
    itemsPerPage,
    preloadingTimerRef,
    getPaginatedConversations
  ]);

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
        prevConversations.filter(conv => conv._id !== conversationToDelete)
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

  useEffect(() => {
    if (activeTab === "conversations") {
      const visibleConversations = getPaginatedConversations(currentPage, itemsPerPage);
      if (visibleConversations.length > 0) {
        const conversationIds = visibleConversations.map(conv => conv._id);
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
      const organizationId = getEffectiveOrgId();
      if (!organizationId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('voiceflow_api_key, voiceflow_project_id')
          .eq('id', organizationId)
          .single();

        if (orgError) throw orgError;
        if (!org.voiceflow_api_key || !org.voiceflow_project_id) {
          console.error('Missing Voiceflow credentials for organization:', organizationId);
          toast.error('Organisasjonen mangler Voiceflow-konfigurasjon');
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}`,
          {
            headers: {
              accept: 'application/json',
              Authorization: org.voiceflow_api_key,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch transcripts');

        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast.error('Kunne ikke laste samtaler');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [getEffectiveOrgId]);

  useEffect(() => {
    const fetchDialog = async () => {
      if (!selectedConversation) return;
      
      const organizationId = getEffectiveOrgId();
      if (!organizationId) return;
      
      // Sjekk om samtalen allerede er cachet (inkludert tom array)
      if (isConversationPreloaded(selectedConversation)) {
        const cached = dialogCache[selectedConversation];
        if (cached !== undefined) {
          setDialog(cached);
          setIsLoadingDialog(false);
          return;
        }
      }
      
      // Sett loading state eksplisitt
      setIsLoadingDialog(true);
      
      try {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('voiceflow_api_key, voiceflow_project_id')
          .eq('id', organizationId)
          .single();

        if (orgError) throw orgError;
        if (!org.voiceflow_api_key || !org.voiceflow_project_id) {
          console.error('Missing Voiceflow credentials');
          setIsLoadingDialog(false);
          return;
        }

        const response = await fetch(
          `https://analytics-api.voiceflow.com/v1/transcript/${selectedConversation}?filterConversation=false`,
          {
            headers: {
              accept: 'application/json',
              Authorization: org.voiceflow_api_key,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch dialog');

        const data = await response.json();
        setDialog(data.history || []);
      } catch (error) {
        console.error('Error fetching dialog:', error);
        toast.error('Kunne ikke laste inn samtale');
        setDialog([]);
      } finally {
        setIsLoadingDialog(false);
      }
    };

    fetchDialog();
  }, [selectedConversation, getEffectiveOrgId, isConversationPreloaded, dialogCache]);

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
