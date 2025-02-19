
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bookmark, CheckCircle, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { formatDate } from "@/utils/conversation-utils";
import { Loader } from "@/components/ui/loader";

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

interface ConversationListProps {
  conversations: VoiceflowTranscript[];
  collapsed: boolean;
  selectedId: string | null;
  isLoading: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onConversationSelect: (id: string) => void;
  onToggleTag: (id: string, tag: "system.saved" | "system.reviewed") => void;
  onDeleteClick: (id: string) => void;
  activeFilter: "all" | "approved" | "saved";
  onFilterChange: (filter: "all" | "approved" | "saved") => void;
}

export const ConversationList = ({
  conversations,
  collapsed,
  selectedId,
  isLoading,
  onCollapsedChange,
  onConversationSelect,
  onToggleTag,
  onDeleteClick,
  activeFilter,
  onFilterChange,
}: ConversationListProps) => {
  const isConversationReviewed = (conv: VoiceflowTranscript) => {
    return conv.reportTags?.includes("system.reviewed") ?? false;
  };

  const isConversationSaved = (conv: VoiceflowTranscript) => {
    return conv.reportTags?.includes("system.saved") ?? false;
  };

  return (
    <div className={cn(
      "border-r border-gray-200 bg-white transition-all duration-300",
      collapsed ? "w-20" : "w-96"
    )}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn(
            "text-xl font-semibold text-primary",
            collapsed ? "hidden" : "text-primary"
          )}>
            Samtaler ({conversations.length})
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange(!collapsed)}
            className="hover:bg-secondary/10"
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>
        
        {!collapsed && (
          <div className="flex gap-2">
            <Button
              variant={activeFilter === "all" ? "secondary" : "outline"}
              onClick={() => onFilterChange("all")}
              className="flex-1"
            >
              Alle samtaler
            </Button>
            <Button
              variant={activeFilter === "approved" ? "secondary" : "outline"}
              onClick={() => onFilterChange("approved")}
              className="flex-1"
            >
              Gjennomgåtte
            </Button>
            <Button
              variant={activeFilter === "saved" ? "secondary" : "outline"}
              onClick={() => onFilterChange("saved")}
              className="flex-1"
            >
              Lagrede
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-auto h-[calc(100vh-144px)]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader size="lg" />
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv._id}
              className={cn(
                "p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors",
                selectedId === conv._id && "bg-secondary text-primary",
                collapsed && "px-2"
              )}
            >
              <div className="flex justify-between items-start">
                <div 
                  className="flex-1"
                  onClick={() => onConversationSelect(conv._id)}
                >
                  {collapsed ? (
                    <div className="text-center">
                      <span className="font-medium">
                        {conv.name ? conv.name.charAt(0) : "U"}
                      </span>
                    </div>
                  ) : (
                    <>
                      <h3 className={cn(
                        "font-medium",
                        selectedId === conv._id ? "text-primary" : "text-gray-700"
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
                
                {!collapsed && (
                  <div className="flex gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTag(conv._id, "system.saved");
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
                        onToggleTag(conv._id, "system.reviewed");
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
                        onDeleteClick(conv._id);
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
  );
};
