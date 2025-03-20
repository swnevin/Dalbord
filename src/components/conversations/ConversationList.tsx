import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bookmark, CheckCircle, ChevronLeft, ChevronRight, Search, Trash2, FileText, Info } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PreloadedIndicator } from "./PreloadedIndicator";

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
  isPreloaded: (id: string) => boolean;
  searchInContent: boolean;
  onToggleSearchInContent: (value: boolean) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  getPaginatedConversations: (page: number, itemsPerPage: number) => VoiceflowTranscript[];
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
  isPreloaded,
  searchInContent,
  onToggleSearchInContent,
  searchTerm,
  onSearchTermChange,
  getPaginatedConversations,
}: ConversationListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchTerm, itemsPerPage]);

  // Always set search in content to true
  useEffect(() => {
    if (!searchInContent) {
      onToggleSearchInContent(true);
    }
  }, [searchInContent, onToggleSearchInContent]);

  const isConversationReviewed = (conv: VoiceflowTranscript) => {
    return conv.reportTags?.includes("system.reviewed") ?? false;
  };

  const isConversationSaved = (conv: VoiceflowTranscript) => {
    return conv.reportTags?.includes("system.saved") ?? false;
  };

  const handleConversationClick = (id: string) => {
    onConversationSelect(id);
  };

  // Get paginated conversations for the current page
  const paginatedConversations = useMemo(() => {
    return getPaginatedConversations(currentPage, itemsPerPage);
  }, [getPaginatedConversations, currentPage, itemsPerPage]);

  const totalConversations = conversations.length;
  const totalPages = Math.ceil(totalConversations / itemsPerPage);

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
            Samtaler ({conversations.length})
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
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Søk etter navn, dato..."
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex items-center text-xs text-gray-600">
                <FileText size={14} className="mr-1" />
                <span>Søker i innhold</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0">
                      <Info size={14} className="text-gray-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="max-w-xs">Søk i innhold fungerer kun for samtaler som er forhåndslastet (indikert med blått ikon).</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
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
                      <div className="flex items-center">
                        <h3 className={cn(
                          "font-medium",
                          selectedId === conv._id ? "text-primary" : "text-gray-700"
                        )}>
                          {conv.name || "Ukjent bruker"}
                        </h3>
                        {isPreloaded(conv._id) && (
                          <PreloadedIndicator isPreloaded={true} />
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
