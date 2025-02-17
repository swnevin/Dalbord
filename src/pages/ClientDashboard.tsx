import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { KnowledgeBase } from "@/components/KnowledgeBase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Bookmark, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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

interface DialogMessage {
  type: string;
  payload?: {
    message?: string;
    text?: string;
    query?: string;
    time?: number;
    payload?: {
      message?: string;
    };
  };
  startTime?: string;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("no", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("no", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("no", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const renderMessage = (message: DialogMessage) => {
    switch (message.type) {
      case 'launch':
        return (
          <div className="text-gray-500 text-sm">
            Samtale startet - {message.startTime && formatTime(message.startTime)}
          </div>
        );
      case 'end':
        return (
          <div className="text-gray-500 text-sm">
            Samtale avsluttet - {message.startTime && formatTime(message.startTime)}
          </div>
        );
      case 'text':
        const messageText = message.payload?.payload?.message;
        if (!messageText) return null;
        return (
          <div className="text-gray-700 text-sm">
            Bot: {messageText} - {message.startTime && formatTime(message.startTime)}
          </div>
        );
      default:
        return (
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {JSON.stringify(message, null, 2)}
          </pre>
        );
    }
  };

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

  const filterDialog = (messages: DialogMessage[]) => {
    const excludedTypes = ['block', 'debug', 'flow', 'path', 'knowledgeBase', 'no-reply'];
    return messages.filter(message => !excludedTypes.includes(message.type));
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
      } catch (error) {
        console.error('Error fetching dialog:', error);
      } finally {
        setIsLoadingDialog(false);
      }
    };

    fetchDialog();
  }, [selectedConversation, user?.organization_id]);

  const isConversationReviewed = (conv: VoiceflowTranscript) => {
    return conv.reportTags?.includes("system.reviewed") ?? false;
  };

  const isConversationSaved = (conv: VoiceflowTranscript) => {
    return conv.reportTags?.includes("system.saved") ?? false;
  };

  const filteredConversations = conversations.filter(conv => {
    switch (activeFilter) {
      case "saved":
        return isConversationSaved(conv);
      case "approved":
        return isConversationReviewed(conv);
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
        {activeTab === "conversations" && (
          <div className="flex flex-1">
            {/* Conversations List */}
            <div 
              className={cn(
                "border-r border-gray-200 bg-white transition-all duration-300",
                conversationsCollapsed ? "w-20" : "w-96"
              )}
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={cn(
                    "text-xl font-semibold text-primary",
                    conversationsCollapsed ? "hidden" : "text-primary"
                  )}>
                    Samtaler ({filteredConversations.length})
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConversationsCollapsed(!conversationsCollapsed)}
                    className="hover:bg-secondary/10"
                  >
                    {conversationsCollapsed ? <ChevronRight /> : <ChevronLeft />}
                  </Button>
                </div>
                
                {!conversationsCollapsed && (
                  <div className="flex gap-2">
                    <Button
                      variant={activeFilter === "all" ? "secondary" : "outline"}
                      onClick={() => setActiveFilter("all")}
                      className="flex-1"
                    >
                      Alle samtaler
                    </Button>
                    <Button
                      variant={activeFilter === "approved" ? "secondary" : "outline"}
                      onClick={() => setActiveFilter("approved")}
                      className="flex-1"
                    >
                      Gjennomgåtte
                    </Button>
                    <Button
                      variant={activeFilter === "saved" ? "secondary" : "outline"}
                      onClick={() => setActiveFilter("saved")}
                      className="flex-1"
                    >
                      Lagrede
                    </Button>
                  </div>
                )}
              </div>

              <div className="overflow-auto h-[calc(100vh-144px)]">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">Laster samtaler...</div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv._id}
                      className={cn(
                        "p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors",
                        selectedConversation === conv._id && "bg-secondary text-primary",
                        conversationsCollapsed && "px-2"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div 
                          className="flex-1"
                          onClick={() => setSelectedConversation(conv._id)}
                        >
                          {conversationsCollapsed ? (
                            <div className="text-center">
                              <span className="font-medium">{conv.name.charAt(0)}</span>
                            </div>
                          ) : (
                            <>
                              <h3 className={cn(
                                "font-medium",
                                selectedConversation === conv._id ? "text-primary" : "text-gray-700"
                              )}>
                                {conv.name}
                              </h3>
                              <div className="mt-1 flex justify-between items-center">
                                <span className="text-xs text-gray-500 capitalize">
                                  {conv.device}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(conv.updatedAt).date}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        
                        {!conversationsCollapsed && (
                          <div className="flex gap-2 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTag(conv._id, "system.saved");
                              }}
                              className={cn(
                                "hover:bg-secondary/10",
                                isConversationSaved(conv) && "text-secondary"
                              )}
                            >
                              <Bookmark className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTag(conv._id, "system.reviewed");
                              }}
                              className={cn(
                                "hover:bg-secondary/10",
                                isConversationReviewed(conv) && "text-green-500"
                              )}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dialog Display */}
            <div className="flex-1 bg-white p-4 overflow-auto">
              {isLoadingDialog ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Laster dialog...
                </div>
              ) : !selectedConversation ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Velg en samtale for å se meldinger
                </div>
              ) : (
                <div className="space-y-4">
                  {filterDialog(dialog).map((message, index) => (
                    <div key={index}>
                      {renderMessage(message)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "knowledge" && <KnowledgeBase />}
      </div>
    </div>
  );
};

export default ClientDashboard;
