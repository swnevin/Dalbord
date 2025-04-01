
import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../components/Sidebar";
import KnowledgeBase from "@/components/KnowledgeBase";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMinimumLoading } from "@/hooks/use-minimum-loading";
import { toast } from "sonner";
import { ConversationList } from "@/components/conversations/ConversationList";
import { ConversationDialog } from "@/components/conversations/ConversationDialog";
import { DeleteDialog } from "@/components/conversations/DeleteDialog";
import { Statistics } from "@/components/statistics/Statistics";
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
  const { user } = useAuth();
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
  const preloadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const preloadingInProgress = useRef<boolean>(false);
  const preloadingQueue = useRef<string[]>([]);

  const {
    dialogCache,
    preloadConversations,
    getCachedDialog,
    isConversationPreloaded,
    searchInDialogContent
  } = useDialogPreloader({
    organizationId: user?.organization_id
  });

  // Define filteredConversations first to ensure getPaginatedConversations can use it
  const filteredConversations = useCallback(() => {
    return conversations.filter(conv => {
      if (activeFilter === "saved" && !conv.reportTags?.includes("system.saved")) return false;
      if (activeFilter === "approved" && !conv.reportTags?.includes("system.reviewed")) return false;
      
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      
      const nameMatch = (conv.name || "Ukjent bruker").toLowerCase().includes(searchLower);
      const dateMatch = conv.updatedAt.toLowerCase().includes(searchLower);
      const deviceMatch = (conv.device || "").toLowerCase().includes(searchLower);
      
      if (searchInContent && isConversationPreloaded(conv._id)) {
        return nameMatch || dateMatch || deviceMatch || 
              searchInDialogContent(searchTerm, conv._id);
      }
      
      return nameMatch || dateMatch || deviceMatch;
    });
  }, [conversations, searchTerm, activeFilter, searchInContent, isConversationPreloaded, searchInDialogContent]);

  // Now define getPaginatedConversations after filteredConversations
  const getPaginatedConversations = useCallback((page: number, itemsPerPage: number) => {
    const filtered = filteredConversations();
    const startIndex = (page - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredConversations]);

  const toggleTag = async (conversationId: string, tag: "system.saved" | "system.reviewed") => {
    if (!user?.organization_id) return;

    try {
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

  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversation(conversationId);
    
    const cachedDialog = getCachedDialog(conversationId);
    if (cachedDialog) {
      setDialog(cachedDialog);
      setIsLoadingDialog(false);
    } else {
      setDialog([]);
      setIsLoadingDialog(true);
    }
    
    if (preloadingTimerRef.current) {
      clearTimeout(preloadingTimerRef.current);
      preloadingTimerRef.current = null;
    }
    
    preloadingTimerRef.current = setTimeout(() => {
      schedulePreloading();
    }, 1000);
  }, [getCachedDialog]);

  const schedulePreloading = useCallback(() => {
    if (!user?.organization_id) return;
    
    const visibleConversations = getPaginatedConversations(currentPage, itemsPerPage);
    if (visibleConversations.length > 0) {
      const conversationIds = visibleConversations
        .map(conv => conv._id)
        .filter(id => id !== selectedConversation && !isConversationPreloaded(id));
        
      if (conversationIds.length > 0) {
        preloadingQueue.current = [...new Set([...preloadingQueue.current, ...conversationIds])];
        processPreloadingQueue();
      }
    }
  }, [
    currentPage,
    itemsPerPage,
    selectedConversation,
    isConversationPreloaded,
    getPaginatedConversations,
    user?.organization_id
  ]);

  const processPreloadingQueue = useCallback(() => {
    if (preloadingInProgress.current || preloadingQueue.current.length === 0) return;
    
    preloadingInProgress.current = true;
    const nextBatch = preloadingQueue.current.slice(0, 5);
    preloadingQueue.current = preloadingQueue.current.slice(5);
    
    // Make sure to wrap this in a Promise.resolve() to ensure it can use .finally()
    Promise.resolve(preloadConversations(nextBatch))
      .finally(() => {
        preloadingInProgress.current = false;
        
        if (preloadingQueue.current.length > 0) {
          setTimeout(() => processPreloadingQueue(), 300);
        }
      });
  }, [preloadConversations]);

  const handleDeleteClick = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete || !user?.organization_id) return;

    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key, voiceflow_project_id')
        .eq('id', user.organization_id)
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

  const handleToggleSearchInContent = useCallback((value: boolean) => {
    setSearchInContent(value);
  }, []);

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  useEffect(() => {
    if (activeTab === "conversations") {
      schedulePreloading();
    }
    
    return () => {
      if (preloadingTimerRef.current) {
        clearTimeout(preloadingTimerRef.current);
        preloadingTimerRef.current = null;
      }
    };
  }, [activeTab, schedulePreloading]);

  useEffect(() => {
    if (activeTab === "conversations") {
      if (preloadingTimerRef.current) {
        clearTimeout(preloadingTimerRef.current);
      }
      preloadingTimerRef.current = setTimeout(() => {
        schedulePreloading();
      }, 300);
    }
    
    return () => {
      if (preloadingTimerRef.current) {
        clearTimeout(preloadingTimerRef.current);
      }
    };
  }, [currentPage, itemsPerPage, schedulePreloading, activeTab]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.organization_id) return;

      try {
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user?.organization_id]);

  useEffect(() => {
    const fetchDialog = async () => {
      if (!selectedConversation || !user?.organization_id) return;
      
      if (getCachedDialog(selectedConversation)) {
        setDialog(getCachedDialog(selectedConversation) || []);
        setIsLoadingDialog(false);
        return;
      }
      
      try {
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
          `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}/${selectedConversation}`,
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
        
        preloadConversations([selectedConversation]);
      } catch (error) {
        console.error('Error fetching dialog:', error);
        toast.error('Kunne ikke laste inn samtale');
      } finally {
        setIsLoadingDialog(false);
      }
    };

    fetchDialog();
  }, [selectedConversation, user?.organization_id, getCachedDialog, preloadConversations]);

  useEffect(() => {
    return () => {
      if (preloadingTimerRef.current) {
        clearTimeout(preloadingTimerRef.current);
        preloadingTimerRef.current = null;
      }
      preloadingInProgress.current = false;
      preloadingQueue.current = [];
    };
  }, []);

  const showLoader = useMinimumLoading(isLoading);
  const showDialogLoader = useMinimumLoading(isLoadingDialog);

  return (
    <div className="flex h-screen bg-cream">
      <Sidebar 
        role="client" 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      <div className="flex-1 overflow-auto">
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
