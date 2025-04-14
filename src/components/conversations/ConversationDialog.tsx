
import { Loader } from "@/components/ui/loader";
import { filterDialog } from "@/utils/conversation-utils";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogMessage } from "./dialog/DialogMessage";
import { QACreationSheet } from "./dialog/QACreationSheet";
import { useQACreation } from "@/hooks/use-qa-creation";

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

interface ConversationDialogProps {
  isLoading: boolean;
  selectedConversation: string | null;
  dialog: DialogMessage[];
}

export const ConversationDialog = ({ 
  isLoading, 
  selectedConversation, 
  dialog 
}: ConversationDialogProps) => {
  const dialogContainerRef = useRef<HTMLDivElement>(null);
  const newestSessionRef = useRef<HTMLDivElement | null>(null);
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false);

  const {
    selectedMessages,
    isQASheetOpen,
    qaTitle,
    qaPair,
    isMessageSelected,
    toggleMessageSelection,
    clearSelection,
    openQASheet,
    setIsQASheetOpen,
    setQaTitle,
    setQaPair,
    saveQAPair
  } = useQACreation();

  useEffect(() => {
    if (selectedConversation) {
      setHasAutoScrolled(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (!isLoading && dialog.length > 0 && newestSessionRef.current && !hasAutoScrolled) {
      setTimeout(() => {
        newestSessionRef.current?.scrollIntoView({ behavior: 'smooth' });
        setHasAutoScrolled(true);
      }, 100);
    }
  }, [dialog, isLoading, hasAutoScrolled]);

  const filteredDialog = filterDialog(dialog);
  const newestSessionIndex = filteredDialog
    .map((msg, index) => msg.type === 'launch' ? index : -1)
    .filter(index => index !== -1)
    .pop();

  if (isLoading) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-4 text-gray-500 text-sm">Laster samtale...</p>
        </div>
      </div>
    );
  }

  if (!selectedConversation) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center h-screen">
        <div className="text-gray-500">
          Velg en samtale for å se meldinger
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col h-screen relative">
      <ScrollArea 
        className="flex-1"
        ref={dialogContainerRef}
      >
        <div className="p-4">
          <div className="space-y-4">
            {filteredDialog.map((message, index) => (
              <DialogMessage 
                key={index}
                message={message}
                isSelected={isMessageSelected(message)}
                onSelect={toggleMessageSelection}
                isNewestSession={index === newestSessionIndex}
                newestSessionRef={index === newestSessionIndex ? newestSessionRef : undefined}
              />
            ))}
          </div>
        </div>
      </ScrollArea>

      {selectedMessages.length > 0 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedMessages.length === 1 
              ? "1 melding valgt" 
              : `${selectedMessages.length} meldinger valgt`}
          </span>
          
          {selectedMessages.length === 2 && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="gap-1"
              onClick={openQASheet}
            >
              <MessageSquarePlus size={16} />
              Opprett Q&A
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearSelection}
          >
            Avbryt
          </Button>
        </div>
      )}

      <QACreationSheet
        open={isQASheetOpen}
        onOpenChange={setIsQASheetOpen}
        title={qaTitle}
        qaPair={qaPair}
        onSave={saveQAPair}
        onQaPairChange={setQaPair}
        onTitleChange={setQaTitle}
      />
    </div>
  );
};
