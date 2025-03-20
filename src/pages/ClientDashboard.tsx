import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { KnowledgeBase } from "@/components/KnowledgeBase";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMinimumLoading } from "@/hooks/use-minimum-loading";
import { toast } from "sonner";
import { ConversationList } from "@/components/conversations/ConversationList";
import { ConversationDialog } from "@/components/conversations/ConversationDialog";
import { DeleteDialog } from "@/components/conversations/DeleteDialog";
import { Statistics } from "@/components/statistics/Statistics";
import { Home } from "@/components/home/Home";

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
  const [loadedDialogs, setLoadedDialogs] = useState<Record<string, boolean>>({});
  const [dialogCache, setDialogCache] = useState<Record<string, any[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [preloadQueue, setPreloadQueue] = useState<string[]>([]);
  const isPreloadingRef = useRef(false);

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

    if (dialogCache[conversationId]) {
      setDialog(dialogCache[conversationId]);
      return;
    }

    setDialog([]);
    setIsLoadingDialog(true);
    fetchDialogById(conversationId);
  }, [dialogCache]);

  const fetchDialogById = async (conversationId: string, setLoading = true) => {
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
      
      setDialogCache(prev => ({
        ...prev,
        [conversationId]: data
      }));
      
      if (selectedConversation === conversationId) {
        setDialog(data);
      }
      
      setLoadedDialogs(prev => ({
        ...prev,
        [conversationId]: true
      }));
    } catch (error) {
      console.error('Error fetching dialog:', error);
      if (selectedConversation === conversationId) {
        toast.error('Kunne ikke laste inn samtale');
      }
    } finally {
      if (setLoading && selectedConversation === conversationId) {
        setIsLoadingDialog(false);
      }
    }
  };

  const processPreloadQueue = useCallback(async () => {
    if (isPreloadingRef.current || preloadQueue.length === 0) return;
    
    isPreloadingRef.current = true;
    
    try {
      const conversationId = preloadQueue[0];
      
      if (!dialogCache[conversationId]) {
        await fetchDialogById(conversationId, false);
      }
      
      setPreloadQueue(prev => prev.slice(1));
    } catch (error) {
      console.error('Error in preload queue processing:', error);
    } finally {
      isPreloadingRef.current = false;
    }
  }, [preloadQueue, dialogCache, fetchDialogById]);

  useEffect(() => {
    processPreloadQueue();
  }, [preloadQueue, processPreloadQueue]);

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
    if (activeTab !== "conversations" || conversations.length === 0) return;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const visibleConversations = conversations
      .slice(startIndex, startIndex + itemsPerPage)
      .map(conv => conv._id)
      .filter(id => !dialogCache[id]);
    
    setPreloadQueue(visibleConversations);
  }, [conversations, activeTab, currentPage, itemsPerPage, dialogCache]);

  const showLoader = useMinimumLoading(isLoading);
  const showDialogLoader = useMinimumLoading(isLoadingDialog);

  const filteredConversations = conversations.filter(conv => {
    switch (activeFilter) {
      case "saved":
        return conv.reportTags?.includes("system.saved") ?? false;
      case "approved":
        return conv.reportTags?.includes("system.reviewed") ?? false;
      default:
        return true;
    }
  });

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
              conversations={filteredConversations}
              collapsed={conversationsCollapsed}
              selectedId={selectedConversation}
              isLoading={showLoader}
              loadedDialogs={loadedDialogs}
              onCollapsedChange={setConversationsCollapsed}
              onConversationSelect={handleSelectConversation}
              onToggleTag={toggleTag}
              onDeleteClick={handleDeleteClick}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
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
