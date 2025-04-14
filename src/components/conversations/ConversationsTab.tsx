
import { useState, useEffect, useCallback } from "react";
import { useConversations } from "@/hooks/use-conversations";
import { useConversationDialog } from "@/hooks/use-conversation-dialog";
import { useMinimumLoading } from "@/hooks/use-minimum-loading";
import { useDialogPreloader } from "@/hooks/use-dialog-preloader";
import { ConversationList } from "./ConversationList";
import { ConversationDialog } from "./ConversationDialog";
import { DeleteDialog } from "./DeleteDialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const ConversationsTab = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationsCollapsed, setConversationsCollapsed] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [preloadingTimerRef, setPreloadingTimerRef] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user?.organization_id) {
      toast.error("Ingen organisasjon funnet. Vennligst kontakt en administrator.");
      console.error("No organization ID found for user");
    }
  }, [user]);

  const {
    conversations,
    isLoading: isLoadingConversations,
    error,
    toggleTag,
    deleteConversation,
    activeFilter,
    setActiveFilter,
    searchTerm,
    setSearchTerm,
    searchInContent,
    setSearchInContent,
    filteredConversations
  } = useConversations();

  const { dialog, isLoadingDialog } = useConversationDialog(selectedConversation);

  const {
    dialogCache,
    preloadConversations,
    getCachedDialog,
    isConversationPreloaded,
    searchInDialogContent
  } = useDialogPreloader({
    organizationId: user?.organization_id
  });

  const handleSelectConversation = useCallback((conversationId: string) => {
    console.log(`Selecting conversation ${conversationId}`);
    setSelectedConversation(conversationId);
    
    // Clear previous timer if exists
    if (preloadingTimerRef) {
      clearTimeout(preloadingTimerRef);
    }
    
    // Set a timer to preload other visible conversations after a delay
    const timer = setTimeout(() => {
      const visibleConversations = getPaginatedConversations(currentPage, itemsPerPage);
      if (visibleConversations.length > 0) {
        const conversationIds = visibleConversations
          .map(conv => conv._id)
          .filter(id => id !== conversationId && !isConversationPreloaded(id));
          
        if (conversationIds.length > 0) {
          console.log(`Preloading ${conversationIds.length} other visible conversations`);
          preloadConversations(conversationIds);
        }
      }
    }, 1000);
    
    setPreloadingTimerRef(timer);
  }, [
    preloadConversations, 
    isConversationPreloaded,
    currentPage,
    itemsPerPage,
    preloadingTimerRef
  ]);

  const handleDeleteClick = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    const success = await deleteConversation(conversationToDelete);
    
    if (success && selectedConversation === conversationToDelete) {
      setSelectedConversation(null);
    }
    
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleToggleSearchInContent = useCallback((value: boolean) => {
    setSearchInContent(value);
  }, [setSearchInContent]);

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, [setSearchTerm]);

  useEffect(() => {
    if (error) {
      console.error("Error loading conversations:", error);
    }
  }, [error]);

  const filteredConversationsWithSearch = useCallback(() => {
    const filtered = filteredConversations();
    
    if (searchTerm && searchInContent) {
      // Also search in dialog content for preloaded conversations
      return filtered.filter(conv => {
        if (isConversationPreloaded(conv._id)) {
          return searchInDialogContent(searchTerm, conv._id) || true;
        }
        return true; // Keep all other conversations that matched basic filters
      });
    }
    
    return filtered;
  }, [filteredConversations, searchTerm, searchInContent, isConversationPreloaded, searchInDialogContent]);

  const getPaginatedConversations = useCallback((page: number, itemsPerPage: number) => {
    const filtered = filteredConversationsWithSearch();
    const startIndex = (page - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredConversationsWithSearch]);

  // Initial preloading of visible conversations
  useEffect(() => {
    console.log("Loading visible conversations for preloading");
    if (user?.organization_id) {
      const visibleConversations = getPaginatedConversations(currentPage, itemsPerPage);
      if (visibleConversations.length > 0) {
        const conversationIds = visibleConversations.map(conv => conv._id);
        preloadConversations(conversationIds);
      }
    }
    
    return () => {
      if (preloadingTimerRef) {
        clearTimeout(preloadingTimerRef);
        setPreloadingTimerRef(null);
      }
    };
  }, [currentPage, itemsPerPage, getPaginatedConversations, preloadConversations, user?.organization_id]);

  const showLoader = useMinimumLoading(isLoadingConversations);
  const showDialogLoader = useMinimumLoading(isLoadingDialog);

  return (
    <div className="flex flex-1">
      <ConversationList
        conversations={filteredConversationsWithSearch()}
        collapsed={conversationsCollapsed}
        selectedId={selectedConversation}
        isLoading={showLoader}
        onCollapsedChange={setConversationsCollapsed}
        onConversationSelect={handleSelectConversation}
        onToggleTag={toggleTag}
        onDeleteClick={handleDeleteClick}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        isPreloaded={isConversationPreloaded}
        searchInContent={searchInContent}
        onToggleSearchInContent={handleToggleSearchInContent}
        searchTerm={searchTerm}
        onSearchTermChange={handleSearchTermChange}
        getPaginatedConversations={getPaginatedConversations}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        totalItems={filteredConversationsWithSearch().length}
      />
      <ConversationDialog
        isLoading={showDialogLoader}
        selectedConversation={selectedConversation}
        dialog={dialog}
      />
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
