import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

export type FilterType = "all" | "approved" | "saved";

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<VoiceflowTranscript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInContent, setSearchInContent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user?.organization_id) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key, voiceflow_project_id')
        .eq('id', user.organization_id)
        .single();

      if (orgError) throw orgError;
      
      if (!org.voiceflow_api_key || !org.voiceflow_project_id) {
        const errorMsg = 'Mangler Voiceflow-legitimasjon';
        setError(errorMsg);
        console.error(errorMsg);
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

      if (!response.ok) {
        throw new Error(`Failed to fetch transcripts: ${response.status}`);
      }

      const data = await response.json();
      setConversations(data);
      console.log(`Loaded ${data.length} conversations successfully`);
    } catch (error: any) {
      const errorMsg = `Feil ved henting av samtaler: ${error.message || 'Ukjent feil'}`;
      setError(errorMsg);
      console.error(errorMsg, error);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [user?.organization_id]);

  useEffect(() => {
    console.log("Initiating conversation fetch");
    fetchConversations();
  }, [fetchConversations]);

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

  const deleteConversation = async (conversationId: string) => {
    if (!user?.organization_id) return;

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
        `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}/${conversationId}`,
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
        prevConversations.filter(conv => conv._id !== conversationId)
      );
      
      toast.success('Samtalen ble slettet');
      return true;
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast.error(error.message || 'Kunne ikke slette samtalen');
      return false;
    }
  };

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
      
      return nameMatch || dateMatch || deviceMatch;
    });
  }, [conversations, searchTerm, activeFilter]);

  return {
    conversations,
    isLoading,
    error,
    toggleTag,
    deleteConversation,
    activeFilter,
    setActiveFilter,
    searchTerm,
    setSearchTerm,
    searchInContent,
    setSearchInContent,
    filteredConversations,
    refreshConversations: fetchConversations
  };
};
