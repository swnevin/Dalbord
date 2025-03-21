
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PreloadedIndicatorProps {
  isPreloaded: boolean;
  className?: string;
}

export const PreloadedIndicator = ({ isPreloaded, className }: PreloadedIndicatorProps) => {
  if (!isPreloaded) return null;
  
  return (
    <Badge 
      variant="secondary" 
      className={cn("ml-1 px-1.5 py-0.5 bg-green-50 text-green-600 gap-1 border-green-200", className)}
    >
      <CheckCircle size={10} />
      <span className="text-[10px]">Lastet</span>
    </Badge>
  );
};
