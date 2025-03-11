import { useState, useEffect } from "react";
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

interface DialogCache {
  [key: string]: any[];
}

type FilterType = "all" | "approved" | "saved";

const ClientDashboard = () => {
  const [activeTab, setActiveTab] = useState("conversations");
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
  const [dialogCache, setDialogCache] = useState<DialogCache>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState<VoiceflowTranscript[]>([]);

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

  const fetchSingleDialog = async (conversationId: string, orgCredentials: any) => {
    try {
      const response = await fetch(
        `https://api.voiceflow.com/v2/transcripts/${orgCredentials.voiceflow_project_id}/${conversationId}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: orgCredentials.voiceflow_api_key,
          },
        }
      );

      if (!response.ok) throw new Error(`Failed to fetch dialog for ${conversationId}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching dialog for ${conversationId}:`, error);
      return [];
    }
  };

  const fetchAllDialogs = async (ids: string[], orgCredentials: any) => {
    const fetchPromises = ids.map(id => fetchSingleDialog(id, orgCredentials));
    try {
      const results = await Promise.allSettled(fetchPromises);
      
      const cache: DialogCache = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          cache[ids[index]] = result.value;
        }
      });
      
      return cache;
    } catch (error) {
      console.error('Error fetching all dialogs:', error);
      return {};
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      applyFilters(conversations);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const dateQuery = query.match(/\d{1,2}[./]\d{1,2}([./]\d{2,4})?/);

    let results = conversations.filter(conv => {
      if (conv.name?.toLowerCase().includes(lowerQuery)) return true;
      
      if (dateQuery) {
        const convDate = new Date(conv.updatedAt).toLocaleDateString("no");
        if (convDate.includes(dateQuery[0])) return true;
      }
      
      if (dialogCache[conv._id]) {
        return dialogCache[conv._id].some(msg => {
          if (msg.payload?.message?.toLowerCase().includes(lowerQuery)) return true;
          if (msg.payload?.text?.toLowerCase().includes(lowerQuery)) return true;
          return false;
        });
      }
      
      return false;
    });

    applyFilters(results);
  };

  const applyFilters = (conversationsToFilter: VoiceflowTranscript[]) => {
    let filtered = [...conversationsToFilter];
    
    switch (activeFilter) {
      case "saved":
        filtered = filtered.filter(conv => conv.reportTags?.includes("system.saved") ?? false);
        break;
      case "approved":
        filtered = filtered.filter(conv => conv.reportTags?.includes("system.reviewed") ?? false);
        break;
      default:
        break;
    }
    
    setFilteredConversations(filtered);
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
        applyFilters(data);

        const conversationIds = data.map((conv: VoiceflowTranscript) => conv._id);
        const cache = await fetchAllDialogs(conversationIds, org);
        setDialogCache(cache);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user?.organization_id]);

  useEffect(() => {
    if (!selectedConversation) {
      setDialog([]);
      return;
    }

    if (dialogCache[selectedConversation]) {
      setDialog(dialogCache[selectedConversation]);
      return;
    }

    const fetchDialog = async () => {
      if (!selectedConversation || !user?.organization_id) return;

      setIsLoadingDialog(true);
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
        
        setDialogCache(prev => ({
          ...prev,
          [selectedConversation]: data
        }));
      } catch (error) {
        console.error('Error fetching dialog:', error);
      } finally {
        setIsLoadingDialog(false);
      }
    };

    fetchDialog();
  }, [selectedConversation, user?.organization_id, dialogCache]);

  useEffect(() => {
    applyFilters(conversations);
  }, [activeFilter, conversations]);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, dialogCache]);

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
        {activeTab === "conversations" && (
          <div className="flex flex-1">
            <ConversationList
              conversations={filteredConversations}
              collapsed={conversationsCollapsed}
              selectedId={selectedConversation}
              isLoading={showLoader}
              onCollapsedChange={setConversationsCollapsed}
              onConversationSelect={setSelectedConversation}
              onToggleTag={toggleTag}
              onDeleteClick={handleDeleteClick}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            <ConversationDialog
              isLoading={showDialogLoader}
              selectedConversation={selectedConversation}
              dialog={dialog}
            />
          </div>
        )}
        {activeTab === "knowledge" && <KnowledgeBase />}
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
