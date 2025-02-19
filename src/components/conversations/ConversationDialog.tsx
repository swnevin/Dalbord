
import { Loader } from "@/components/ui/loader";
import { formatTime, filterDialog, formatText, containsIframe, extractIframeAndCleanText } from "@/utils/conversation-utils";
import { useRef } from "react";

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
                <button
                  key={index}
                  className="justify-start text-left px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  {button.name}
                </button>
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
        return null;
    }
  };

  return (
    <div className="flex-1 bg-white flex flex-col h-screen">
      <div 
        ref={dialogContainerRef} 
        className="flex-1 overflow-y-auto p-4"
      >
        {isLoading ? (
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
    </div>
  );
};
