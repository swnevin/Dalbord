
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RequestsHeaderProps {
  unresolvedCount: number;
  totalUnresolvedCount: number;
  showFilteredResults: boolean;
  onToggleFilter: () => void;
}

export const RequestsHeader = ({
  unresolvedCount,
  totalUnresolvedCount,
  showFilteredResults,
  onToggleFilter
}: RequestsHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Viser {unresolvedCount} av {totalUnresolvedCount} uløste henvendelser
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Filter skjuler henvendelser med "not_a_question" som spørsmål</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onToggleFilter}
      >
        {showFilteredResults ? "Vis alle" : "Vis filtrerte"}
      </Button>
    </div>
  );
};
