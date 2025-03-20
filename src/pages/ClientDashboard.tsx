
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

  // Handle conversation selection and immediately trigger loading state
  const handleConversationSelect = (id: string) => {
    // Set the selected conversation immediately
    setSelectedConversation(id);
    // Reset dialog data to ensure loading state shows up
    setDialog([]);
    // Set loading state to true immediately
    setIsLoadingDialog(true);
    // Then fetch the dialog data
    fetchDialog(id);
  };

  // Separate function to fetch dialog data
  const fetchDialog = async (conversationId: string) => {
    if (!conversationId || !user?.organization_id) return;

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
      setDialog(data);
    } catch (error) {
      console.error('Error fetching dialog:', error);
      toast.error('Kunne ikke laste inn samtalen');
    } finally {
      setIsLoadingDialog(false);
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
    // Load dialog when selected conversation changes
    if (selectedConversation) {
      fetchDialog(selectedConversation);
    }
  }, []); // intentionally empty to avoid refetching when component remounts

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
              onCollapsedChange={setConversationsCollapsed}
              onConversationSelect={handleConversationSelect}
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
