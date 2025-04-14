
import { formatTime } from "@/utils/conversation-utils";
import { containsIframe, extractIframeAndCleanText, formatText } from "@/utils/conversation-utils";

export interface DialogMessageProps {
  message: any;
  isSelected: boolean;
  onSelect: (message: any) => void;
  isNewestSession?: boolean;
  newestSessionRef?: React.RefObject<HTMLDivElement>;
}

export const DialogMessage = ({ message, isSelected, onSelect, isNewestSession, newestSessionRef }: DialogMessageProps) => {
  if (message.type === 'launch') {
    return (
      <div 
        className="flex justify-center my-4"
        ref={isNewestSession ? newestSessionRef : null}
      >
        <div className={`bg-gray-100 rounded-full px-4 py-1 text-xs text-gray-500 ${isNewestSession ? 'bg-primary/10 font-medium' : ''}`}>
          Samtale startet - {message.startTime && formatTime(message.startTime)}
        </div>
      </div>
    );
  }
  
  if (message.type === 'end') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 rounded-full px-4 py-1 text-xs text-gray-500">
          Samtale avsluttet - {message.startTime && formatTime(message.startTime)}
        </div>
      </div>
    );
  }
  
  if (message.type === 'text') {
    const messageText = message.payload?.payload?.message;
    if (!messageText) return null;

    const hasIframe = containsIframe(messageText);
    const { cleanText, iframeSrc } = hasIframe 
      ? extractIframeAndCleanText(messageText)
      : { cleanText: messageText, iframeSrc: null };
    
    const formattedText = formatText(cleanText);

    return (
      <div 
        className={`flex flex-col gap-1 my-2 ${isSelected ? 'message-selected' : ''} cursor-pointer`} 
        onClick={() => onSelect(message)}
      >
        <div className="flex items-end gap-2 max-w-[80%]">
          <div className={`bg-primary text-primary-foreground p-3 rounded-2xl rounded-bl-none transition-all 
            ${isSelected ? 'ring-2 ring-secondary ring-offset-2' : 'hover:ring-1 hover:ring-secondary/50 hover:ring-offset-1'}`}>
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
  }
  
  if (message.type === 'choice') {
    const buttons = message.payload?.payload?.buttons;
    if (!buttons?.length) return null;
    return (
      <div 
        className={`flex flex-col gap-2 my-2 max-w-[80%] ${isSelected ? 'message-selected' : ''} cursor-pointer`}
        onClick={() => onSelect(message)}
      >
        <div className="flex flex-col gap-2">
          {buttons.map((button: any, index: number) => (
            <button
              key={index}
              className={`justify-start text-left px-4 py-2 border rounded-md hover:bg-gray-50 transition-all 
                ${isSelected ? 'ring-2 ring-secondary ring-offset-2' : 'hover:ring-1 hover:ring-secondary/50 hover:ring-offset-1'}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(message);
              }}
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
  }
  
  if (message.type === 'request') {
    const query = message.payload?.payload?.query;
    const label = message.payload?.payload?.label;
    const userText = query || label;
    if (!userText) return null;
    return (
      <div 
        className={`flex flex-col items-end gap-1 my-2 ${isSelected ? 'message-selected' : ''} cursor-pointer`}
        onClick={() => onSelect(message)}
      >
        <div className="flex items-end gap-2 max-w-[80%]">
          <div className={`bg-secondary text-secondary-foreground p-3 rounded-2xl rounded-br-none transition-all 
            ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/50 hover:ring-offset-1'}`}>
            {userText}
          </div>
        </div>
        <span className="text-xs text-gray-500 mr-2">
          {message.startTime && formatTime(message.startTime)}
        </span>
      </div>
    );
  }
  
  return null;
};
