
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bookmark, CheckCircle, ChevronLeft, ChevronRight, Download, Filter, Search, Trash2 } from "lucide-react";
import { formatDate } from "@/utils/conversation-utils";
import { Loader } from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo } from "react";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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

interface DialogCacheEntry {
  dialog: any[];
  loadedAt: number;
  status: "loading" | "loaded" | "error";
}

interface DialogCache {
  [conversationId: string]: DialogCacheEntry;
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
  dialogCache?: DialogCache;
  currentlyLoading?: string | null;
  searchInDialogs?: boolean;
  onSearchInDialogsChange?: (value: boolean) => void;
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
  dialogCache = {},
  currentlyLoading = null,
  searchInDialogs = false,
  onSearchInDialogsChange = () => {},
}: ConversationListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchTerm, itemsPerPage]);

  const isConversationReviewed = (conv: VoiceflowTranscript) => {
    return conv.reportTags?.includes("system.reviewed") ?? false;
  };

  const isConversationSaved = (conv: VoiceflowTranscript) => {
    return conv.reportTags?.includes("system.saved") ?? false;
  };

  const getConversationStatus = (convId: string) => {
    if (!dialogCache[convId]) return null;
    return dialogCache[convId].status;
  };

  const handleConversationClick = (id: string) => {
    onConversationSelect(id);
  };

  // Filter conversations based on search term and optionally search in dialogs
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      // Apply the active filter first
      if (activeFilter === "approved" && !isConversationReviewed(conv)) return false;
      if (activeFilter === "saved" && !isConversationSaved(conv)) return false;
      
      // Then apply the search filter if there is a search term
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = (conv.name || "Ukjent bruker").toLowerCase().includes(searchLower);
      const dateMatch = formatDate(conv.updatedAt).date.toLowerCase().includes(searchLower);
      const deviceMatch = (conv.device || "").toLowerCase().includes(searchLower);

      // Standard search in conversation metadata
      const metadataMatch = nameMatch || dateMatch || deviceMatch;
      
      // If not searching in dialogs or dialog isn't loaded yet, return based on metadata
      if (!searchInDialogs || !dialogCache[conv._id] || dialogCache[conv._id].status !== "loaded") {
        return metadataMatch;
      }
      
      // Search in dialog content if dialog is loaded
      const dialogContentMatch = dialogCache[conv._id].dialog.some(message => {
        // Search in user messages
        if (message.type === 'request' && message.payload?.payload) {
          const query = message.payload.payload.query || message.payload.payload.label || "";
          return query.toLowerCase().includes(searchLower);
        }
        
        // Search in bot messages
        if (message.type === 'text' && message.payload?.payload) {
          const botMessage = message.payload.payload.message || "";
          return botMessage.toLowerCase().includes(searchLower);
        }
        
        return false;
      });
      
      return metadataMatch || dialogContentMatch;
    });
  }, [conversations, searchTerm, activeFilter, searchInDialogs, dialogCache]);

  // Paginate conversations
  const paginatedConversations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredConversations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredConversations, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredConversations.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className={cn(
      "border-r border-gray-200 bg-white transition-all duration-300 flex flex-col h-screen",
      collapsed ? "w-20" : "w-96"
    )}>
      <div className="p-4 border-b border-gray-200 flex flex-col gap-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className={cn(
            "text-xl font-semibold text-primary",
            collapsed ? "hidden" : "text-primary"
          )}>
            Samtaler ({filteredConversations.length})
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange(!collapsed)}
            className="hover:bg-secondary/10 active:bg-secondary/20"
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>
        
        {!collapsed && (
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Søk etter navn, dato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={activeFilter === "all" ? "secondary" : "outline"}
                  onClick={() => onFilterChange("all")}
                  className="flex-1"
                >
                  Alle
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
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSearchInDialogsChange(!searchInDialogs)}
                className={cn(
                  "gap-1",
                  searchInDialogs && "bg-secondary/20"
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                {searchInDialogs ? "Dialogs" : "Meta"}
              </Button>
            </div>
          </>
        )}
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center py-10">
            <Loader size="lg" text="Laster samtaler..." />
          </div>
        ) : paginatedConversations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center text-gray-500">
            {searchTerm ? (
              <p>Ingen samtaler matchet søket ditt.</p>
            ) : (
              <p>Ingen samtaler funnet for gjeldende filter.</p>
            )}
          </div>
        ) : (
          paginatedConversations.map((conv) => (
            <div
              key={conv._id}
              className={cn(
                "p-4 border-b border-gray-100 cursor-pointer transition-all duration-100",
                selectedId === conv._id 
                  ? "bg-secondary text-primary" 
                  : "hover:bg-gray-50 active:bg-gray-100",
                collapsed && "px-2"
              )}
              onClick={() => handleConversationClick(conv._id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {collapsed ? (
                    <div className="text-center">
                      <span className="font-medium">
                        {conv.name ? conv.name.charAt(0) : "U"}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          "font-medium",
                          selectedId === conv._id ? "text-primary" : "text-gray-700"
                        )}>
                          {conv.name || "Ukjent bruker"}
                        </h3>
                        
                        {/* Preload status indicator */}
                        {getConversationStatus(conv._id) === "loaded" && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-1.5 py-0 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            <span className="text-xs">Lastet</span>
                          </Badge>
                        )}
                        
                        {currentlyLoading === conv._id && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-1.5 py-0 text-xs animate-pulse">
                            <Download className="h-3 w-3 mr-1" />
                            <span className="text-xs">Laster</span>
                          </Badge>
                        )}
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
                        "hover:bg-secondary/10 active:bg-secondary/20",
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
                        "hover:bg-secondary/10 active:bg-secondary/20",
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
                      className="hover:bg-secondary/10 active:bg-secondary/20 text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </ScrollArea>

      {!collapsed && (
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Resultater per side:</span>
            <Select 
              value={String(itemsPerPage)} 
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="20" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={handlePrevPage} 
                    className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}
                    aria-disabled={currentPage === 1}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm">
                    Side {currentPage} av {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    onClick={handleNextPage} 
                    className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}
                    aria-disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
};
