
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

const ClientDashboard = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<VoiceflowTranscript[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationsCollapsed, setConversationsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.organization_id) return;

      try {
        // Get organization's Voiceflow credentials
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

        // Fetch transcripts from Voiceflow
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

  return (
    <div className="flex h-screen bg-cream">
      <Sidebar role="client" />
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
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={cn(
                      "font-medium",
                      selectedConversation === conv._id ? "text-primary" : "text-gray-700"
                    )}>
                      {conversationsCollapsed ? conv.name.charAt(0) : conv.name}
                    </h3>
                    {!conversationsCollapsed && (
                      <span className="text-sm text-gray-500">
                        {new Date(conv.updatedAt).toLocaleTimeString("no", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Display */}
        <div className="flex-1 bg-white p-4">
          <div className="h-full flex items-center justify-center text-gray-500">
            {isLoading ? "Laster..." : "Velg en samtale for å se meldinger"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
