
import { useState, useEffect, useCallback } from "react";
import { useConversations } from "@/hooks/use-conversations";
import { useConversationDialog } from "@/hooks/use-conversation-dialog";
import { useMinimumLoading } from "@/hooks/use-minimum-loading";
import { useDialogPreloader } from "@/hooks/use-dialog-preloader";
import { ConversationList } from "./ConversationList";
import { ConversationDialog } from "./ConversationDialog";
import { DeleteDialog } from "./DeleteDialog";

export const ConversationsTab = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationsCollapsed, setConversationsCollapsed] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [preloadingTimerRef, setPreloadingTimerRef] = useState<NodeJS.Timeout | null>(null);

  const {
    conversations,
    isLoading: isLoadingConversations,
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
    organizationId: null // This will be filled by the hook
  });

  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversation(conversationId);
    
    if (preloadingTimerRef) {
      clearTimeout(preloadingTimerRef);
    }
    
    const timer = setTimeout(() => {
      const visibleConversations = getPaginatedConversations(currentPage, itemsPerPage);
      if (visibleConversations.length > 0) {
        const conversationIds = visibleConversations
          .map(conv => conv._id)
          .filter(id => id !== conversationId && !isConversationPreloaded(id));
          
        if (conversationIds.length > 0) {
          preloadConversations(conversationIds);
        }
      }
    }, 1000);
    
    setPreloadingTimerRef(timer);
  }, [
    getCachedDialog, 
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
  }, []);

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const filteredConversationsWithSearch = useCallback(() => {
    const filtered = filteredConversations();
    
    if (searchTerm && searchInContent) {
      // Add the dialog content search here
      return filtered.filter(conv => {
        if (isConversationPreloaded(conv._id)) {
          return searchInDialogContent(searchTerm, conv._id) || true; // Return true if found in dialog, or if already matched by other criteria
        }
        return true; // Keep all other conversations that matched the basic filter
      });
    }
    
    return filtered;
  }, [filteredConversations, searchTerm, searchInContent, isConversationPreloaded, searchInDialogContent]);

  const getPaginatedConversations = useCallback((page: number, itemsPerPage: number) => {
    const filtered = filteredConversationsWithSearch();
    const startIndex = (page - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredConversationsWithSearch]);

  useEffect(() => {
    const visibleConversations = getPaginatedConversations(currentPage, itemsPerPage);
    if (visibleConversations.length > 0) {
      const conversationIds = visibleConversations.map(conv => conv._id);
      preloadConversations(conversationIds);
    }
    
    return () => {
      if (preloadingTimerRef) {
        clearTimeout(preloadingTimerRef);
        setPreloadingTimerRef(null);
      }
    };
  }, [currentPage, itemsPerPage, getPaginatedConversations, preloadConversations]);

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
