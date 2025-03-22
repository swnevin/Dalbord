
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  isUser: boolean;
  message: string;
  timestamp: string;
}

const ChatMessage = ({ isUser, message, timestamp }: ChatMessageProps) => {
  // Check if the message contains an iframe
  const containsIframe = /<\s*iframe[\s\S]*?src\s*=\s*["'].*?["'][\s\S]*?>/.test(message);
  
  let iframeSrc = null;
  let cleanMessage = message;
  
  // Extract iframe source if present
  if (containsIframe) {
    const iframeMatch = message.match(/<\s*iframe[\s\S]*?src\s*=\s*["'](.*?)["'][\s\S]*?(?:\/?>|<\/iframe>)/);
    iframeSrc = iframeMatch ? iframeMatch[1] : null;
    cleanMessage = message.replace(/<\s*iframe[\s\S]*?(?:\/?>|<\/iframe>)/, '').trim();
  }

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-lg p-3",
          isUser
            ? "bg-primary text-white rounded-tr-none"
            : "bg-gray-100 text-gray-800 rounded-tl-none"
        )}
      >
        {cleanMessage && cleanMessage.trim() !== "" && (
          <p className="text-sm">{cleanMessage}</p>
        )}
        
        {iframeSrc && (
          <div className="relative w-full pt-[56.25%] mt-2">
            <iframe
              src={iframeSrc}
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              style={{ border: "none" }}
              allowFullScreen
              title="Embedded content"
            />
          </div>
        )}
        
        <span className={cn(
          "text-xs mt-1 block",
          isUser ? "text-primary-foreground/80" : "text-gray-500"
        )}>
          {new Date(timestamp).toLocaleTimeString("no", {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
