
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: number;
  name: string;
  timestamp: string;
  unread?: boolean;
}

const ClientDashboard = () => {
  const [conversations] = useState<Conversation[]>([
    {
      id: 1,
      name: "Jon Eldon",
      timestamp: "2024-03-20 14:30",
    },
    {
      id: 2,
      name: "Maria Hansen",
      timestamp: "2024-03-20 15:45",
      unread: true,
    },
  ]);

  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [conversationsCollapsed, setConversationsCollapsed] = useState(false);

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
              Samtaler (29)
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
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors",
                  selectedConversation === conv.id && "bg-secondary text-primary",
                  conversationsCollapsed && "px-2"
                )}
                onClick={() => setSelectedConversation(conv.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={cn(
                    "font-medium",
                    selectedConversation === conv.id ? "text-primary" : "text-gray-700"
                  )}>
                    {conversationsCollapsed ? conv.name.charAt(0) : conv.name}
                  </h3>
                  {!conversationsCollapsed && (
                    <span className="text-sm text-gray-500">
                      {new Date(conv.timestamp).toLocaleTimeString("no", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Display */}
        <div className="flex-1 bg-white p-4">
          <div className="h-full flex items-center justify-center text-gray-500">
            Velg en samtale for å se meldinger
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
