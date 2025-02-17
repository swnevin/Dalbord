import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { KnowledgeBase } from "@/components/KnowledgeBase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ChatMessage from "@/components/ChatMessage";

interface VoiceflowTranscript {
  _id: string;
  name: string;
  updatedAt: string;
  device: string;
  sessionID: string;
}

interface DialogTurn {
  turnID: string;
  format: string;
  type: string;
  payload: any;
  startTime: string;
}

interface ProcessedMessage {
  isUser: boolean;
  message: string;
  timestamp: string;
  options?: string[];
}

const ClientDashboard = () => {
  const [activeTab, setActiveTab] = useState("conversations");
  const { user } = useAuth();
  const [conversations, setConversations] = useState<VoiceflowTranscript[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationsCollapsed, setConversationsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dialog, setDialog] = useState<DialogTurn[]>([]);
  const [isLoadingDialog, setIsLoadingDialog] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [dialog]);

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

  const processDialog = (dialog: DialogTurn[]): ProcessedMessage[] => {
    const messages: ProcessedMessage[] = [];

    dialog.forEach((turn) => {
      if (turn.type === "request") {
        // User message - safely handle different payload types
        let message = "";
        
        if (turn.payload.type === "text") {
          message = turn.payload.payload;
        } else if (turn.payload.payload?.label) {
          message = turn.payload.payload.label;
        } else if (typeof turn.payload.payload === 'string') {
          message = turn.payload.payload;
        } else {
          message = "Valgt alternativ";
        }
        
        if (message && message.trim()) {
          messages.push({
            isUser: true,
            message,
            timestamp: turn.startTime,
          });
        }
      } 
      else if (turn.type === "text" && turn.payload?.message) {
        // Bot message - only add if there's actual content
        const message = turn.payload.message.trim();
        if (message) {
          messages.push({
            isUser: false,
            message,
            timestamp: turn.startTime,
          });
        }
      }
      else if (turn.type === "choice" && Array.isArray(turn.payload?.buttons) && turn.payload.buttons.length > 0) {
        // Bot options - only add if there are actual buttons
        const options = turn.payload.buttons
          .map((button: any) => button.name)
          .filter((name: string) => name && name.trim());
        
        if (options.length > 0) {
          messages.push({
            isUser: false,
            message: "Alternativer:",
            timestamp: turn.startTime,
            options,
          });
        }
      }
    });

    return messages;
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
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className={cn(
              "text-xl font-semibold text-primary",
              conversationsCollapsed && "hidden"
            )}>
              Samtaler ({conversations.length})
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
          <div className="overflow-auto h-[calc(100vh-144px)]">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Laster samtaler...</div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv._id}
                  className={cn(
                    "p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors",
                    selectedConversation === conv._id && "bg-secondary text-primary",
                    conversationsCollapsed && "px-2"
                  )}
                  onClick={() => setSelectedConversation(conv._id)}
                >
                  {conversationsCollapsed ? (
                    <div className="text-center">
                      <span className="font-medium">{conv.name.charAt(0)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <h3 className={cn(
                          "font-medium",
                          selectedConversation === conv._id ? "text-primary" : "text-gray-700"
                        )}>
                          {conv.name}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(conv.updatedAt).time}
                        </span>
                      </div>
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
            <div className="max-w-3xl mx-auto">
              {processDialog(dialog).map((message, index) => (
                <div key={index}>
                  <ChatMessage
                    isUser={message.isUser}
                    message={message.message}
                    timestamp={message.timestamp}
                  />
                  {message.options && (
                    <div className="ml-4 mb-4 flex flex-wrap gap-2">
                      {message.options.map((option, optionIndex) => (
                        <Button
                          key={optionIndex}
                          variant="secondary"
                          size="sm"
                          className="opacity-50"
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
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
