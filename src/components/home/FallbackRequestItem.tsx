
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { CheckCircle } from "lucide-react";

interface FallbackRequest {
  id: string;
  query: string;
  response: string;
  created_at: string;
  is_resolved: boolean;
}

interface FallbackRequestItemProps {
  request: FallbackRequest;
  onClick: () => void;
  isResolved?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}

export const FallbackRequestItem = ({ 
  request, 
  onClick, 
  isResolved = false, 
  onContextMenu,
  children
}: FallbackRequestItemProps) => {
  const formattedDate = formatDistanceToNow(new Date(request.created_at), {
    addSuffix: true,
    locale: nb
  });
  
  return (
    <div 
      className={`py-4 px-2 ${isResolved ? "" : "hover:bg-muted/50 transition-colors cursor-pointer"} rounded-md`}
      onClick={isResolved ? undefined : onClick}
      onContextMenu={onContextMenu}
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <h3 className="font-medium break-words leading-tight">{request.query}</h3>
            {isResolved && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-1" />}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{formattedDate}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {request.response}
        </p>
        {children}
      </div>
    </div>
  );
};
