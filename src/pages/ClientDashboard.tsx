import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { KnowledgeBase } from "@/components/KnowledgeBase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Bookmark, CheckCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "@/components/ui/loader";
import { useMinimumLoading } from "@/hooks/use-minimum-loading";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

interface DialogMessage {
  type: string;
  payload?: {
    message?: string;
    text?: string;
    query?: string;
    time?: number;
    type?: string;
    payload?: {
      message?: string;
      buttons?: Array<{
        name: string;
        request: {
          payload: {
            label: string;
          };
        };
      }>;
      query?: string;
      label?: string;
    };
  };
  startTime?: string;
}

type FilterType = "all" | "approved" | "saved";

const formatText = (text: string) => {
  // First, normalize line endings
  text = text.replace(/\r\n/g, '\n');
  
  // Handle bold text
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Handle links
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-primary hover:underline">$1</a>');
  
  // Handle numbered lists and create paragraphs
  // Split text into lines
  const lines = text.split('\n');
  const formattedLines = lines.map(line => {
    // Check if line is a numbered list item
    if (/^\d+\.\s/.test(line)) {
      return `<div class="mt-2">${line}</div>`;
    }
    // If not a list item and not empty, wrap in p tag
    return line.trim() ? `<p>${line}</p>` : '';
  });
  
  text = formattedLines.join('');
  
  // Handle blockquotes
  text = text.replace(/<p>>(.*?)<\/p>/g, '<blockquote class="border-l-4 border-gray-300 pl-4 my-2 italic">$1</blockquote>');
  
  return text;
};

const containsIframe = (text: string) => {
  return text.includes('<iframe');
};

const extractIframeAndCleanText = (text: string) => {
  const iframeMatch = text.match(/<iframe[^>]*src="([^"]*)"[^>]*>/);
  const iframeSrc = iframeMatch ? iframeMatch[1] : null;
  
  // Remove the entire iframe tag and any surrounding whitespace
  const cleanText = text.replace(/<iframe[^>]*>.*?<\/iframe>/s, '').trim();
  
  return { cleanText, iframeSrc };
};

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
  const [sessions, setSessions] = useState<{ start: number; end: number }[]>([]);
  const dialogContainerRef = useRef<HTMLDivElement>(null);

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
          <div className="flex justify-center my-4">
            <div className="bg-gray-100 rounded-full px-4 py-1 text-xs text-gray-500">
              Samtale startet - {message.startTime && formatTime(message.startTime)}
            </div>
          </div>
        );
      case 'end':
        return (
          <div className="flex justify-center my-4">
            <div className="bg-gray-100 rounded-full px-4 py-1 text-xs text-gray-500">
              Samtale avsluttet - {message.startTime && formatTime(message.startTime)}
            </div>
          </div>
        );
      case 'text':
        const messageText = message.payload?.payload?.message;
        if (!messageText) return null;

        const hasIframe = containsIframe(messageText);
        const { cleanText, iframeSrc } = hasIframe 
          ? extractIframeAndCleanText(messageText)
          : { cleanText: messageText, iframeSrc: null };
        
        const formattedText = formatText(cleanText);

        return (
          <div className="flex flex-col gap-1 my-2">
            <div className="flex items-end gap-2 max-w-[80%]">
              <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-bl-none">
                <div className="space-y-2">
                  <div 
                    dangerouslySetInnerHTML={{ __html: formattedText }}
                    className="prose prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0"
                  />
                  {iframeSrc && (
                    <div className="relative w-full pt-[56.25%] mt-4">
                      <iframe
                        src={iframeSrc}
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        frameBorder="0"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-500 ml-2">
              {message.startTime && formatTime(message.startTime)}
            </span>
          </div>
        );
      case 'choice':
        const buttons = message.payload?.payload?.buttons;
        if (!buttons?.length) return null;
        return (
          <div className="flex flex-col gap-2 my-2 max-w-[80%]">
            <div className="flex flex-col gap-2">
              {buttons.map((button, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start text-left"
                >
                  {button.name}
                </Button>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-2">
              {message.startTime && formatTime(message.startTime)}
            </span>
          </div>
        );
      case 'request':
        const query = message.payload?.payload?.query;
        const label = message.payload?.payload?.label;
        const userText = query || label;
        if (!userText) return null;
        return (
          <div className="flex flex-col items-end gap-1 my-2">
            <div className="flex items-end gap-2 max-w-[80%]">
              <div className="bg-secondary text-secondary-foreground p-3 rounded-2xl rounded-br-none">
                {userText}
              </div>
            </div>
            <span className="text-xs text-gray-500 mr-2">
              {message.startTime && formatTime(message.startTime)}
            </span>
          </div>
        );
      default:
        return (
          <div className="my-2 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm font-mono overflow-auto">
            <div className="text-xs text-gray-500 mb-2">
              Unknown message type: {message.type} - {message.startTime && formatTime(message.startTime)}
            </div>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(message, null, 2)}
            </pre>
          </div>
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

  const showLoader = useMinimumLoading(isLoading);
  const showDialogLoader = useMinimumLoading(isLoadingDialog);

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

  const identifySessions = (messages: DialogMessage[]) => {
    const newSessions: { start: number; end: number }[] = [];
    let currentStart = -1;

    messages.forEach((message, index) => {
      if (message.type === 'launch') {
        currentStart = index;
      } else if (message.type === 'end' && currentStart !== -1) {
        newSessions.push({ start: currentStart, end: index });
        currentStart = -1;
      }
    });

    // If we have a start without an end, include it
    if (currentStart !== -1) {
      newSessions.push({ start: currentStart, end: messages.length - 1 });
    }

    setSessions(newSessions);
  };

  const scrollToSession = (index: number) => {
    if (!dialogContainerRef.current) return;
    
    const sessionElement = dialogContainerRef.current.children[sessions[index].start];
    if (sessionElement) {
      sessionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (dialog.length > 0) {
      identifySessions(filterDialog(dialog));
      // Scroll to latest session by default
      setTimeout(() => {
        if (sessions.length > 0) {
          scrollToSession(sessions.length - 1);
        }
      }, 100);
    }
  }, [dialog]);

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
                {showLoader ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader size="lg" />
                  </div>
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
                              <span className="font-medium">
                                {conv.name ? conv.name.charAt(0) : "U"}
                              </span>
                            </div>
                          ) : (
                            <>
                              <h3 className={cn(
                                "font-medium",
                                selectedConversation === conv._id ? "text-primary" : "text-gray-700"
                              )}>
                                {conv.name || "Ukjent bruker"}
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
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(conv._id);
                              }}
                              className="hover:bg-secondary/10 text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 bg-white flex flex-col h-screen">
              <div ref={dialogContainerRef} className="flex-1 overflow-y-auto p-4">
                {showDialogLoader ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader size="lg" />
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

              {sessions.length > 1 && selectedConversation && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-gray-200">
                    <span className="text-sm text-gray-500 mr-2">Økter:</span>
                    {sessions.map((_, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => scrollToSession(index)}
                        className="rounded-full h-8 w-8 p-0"
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "knowledge" && <KnowledgeBase />}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bekreft sletting</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne samtalen? Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientDashboard;
