
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";

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
}

export const FallbackRequestItem = ({ request, onClick }: FallbackRequestItemProps) => {
  const formattedDate = formatDistanceToNow(new Date(request.created_at), {
    addSuffix: true,
    locale: nb
  });
  
  return (
    <div 
      className="py-4 px-2 hover:bg-muted/50 transition-colors cursor-pointer rounded-md" 
      onClick={onClick}
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium truncate">{request.query}</h3>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {request.response}
        </p>
      </div>
    </div>
  );
};
