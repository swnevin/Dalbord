
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread?: boolean;
}

const ClientDashboard = () => {
  const [conversations] = useState<Conversation[]>([
    {
      id: 1,
      name: "Jon Eldon",
      lastMessage: "Jeg kan hjelpe deg med bestillingen...",
      timestamp: "2024-03-20 14:30",
    },
    {
      id: 2,
      name: "Maria Hansen",
      lastMessage: "For å endre leveringsadressen din, k...",
      timestamp: "2024-03-20 15:45",
      unread: true,
    },
  ]);

  return (
    <div className="flex h-screen bg-cream">
      <Sidebar role="client" />
      <div className="flex flex-1">
        {/* Conversations List */}
        <div className="w-96 border-r border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-primary mb-4">
              Samtaler (29)
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Søk..."
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="overflow-auto h-[calc(100vh-144px)]">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-primary">{conv.name}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(conv.timestamp).toLocaleTimeString("no", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
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
