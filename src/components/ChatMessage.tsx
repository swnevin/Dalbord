
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  isUser: boolean;
  message: string;
  timestamp: string;
}

const ChatMessage = ({ isUser, message, timestamp }: ChatMessageProps) => {
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
            ? "bg-dalai-yellow text-primary rounded-tr-none"
            : "bg-primary text-white rounded-tl-none"
        )}
      >
        <p className="text-sm">{message}</p>
        <span className={cn(
          "text-xs mt-1 block",
          isUser ? "text-primary/80" : "text-primary-foreground/80"
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
