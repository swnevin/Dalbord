
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
  const [savedConversations, setSavedConversations] = useState<Set<string>>(new Set());
  const [approvedConversations, setApprovedConversations] = useState<Set<string>>(new Set());

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

  const toggleSaved = (conversationId: string) => {
    setSavedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId);
      } else {
        newSet.add(conversationId);
      }
      return newSet;
    });
  };

  const toggleApproved = (conversationId: string) => {
    setApprovedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId);
      } else {
        newSet.add(conversationId);
      }
      return newSet;
    });
  };

  const filteredConversations = conversations.filter(conv => {
    switch (activeFilter) {
      case "saved":
        return savedConversations.has(conv._id);
      case "approved":
        return approvedConversations.has(conv._id);
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
                    conversationsCollapsed && "hidden"
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
                                toggleSaved(conv._id);
                              }}
                              className={cn(
                                "hover:bg-secondary/10",
                                savedConversations.has(conv._id) && "text-secondary"
                              )}
                            >
                              <Bookmark className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleApproved(conv._id);
                              }}
                              className={cn(
                                "hover:bg-secondary/10",
                                approvedConversations.has(conv._id) && "text-green-500"
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
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {JSON.stringify(dialog, null, 2)}
                </pre>
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
