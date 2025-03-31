
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoIcon, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

interface FeedbackSummaryCardsProps {
  escalatedCount: number;
  isLoading: boolean;
}

export const FeedbackSummaryCards: React.FC<FeedbackSummaryCardsProps> = ({
  escalatedCount,
  isLoading
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Eskalerte samtaler
        </CardTitle>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-2 max-w-xs">
                <p className="font-medium">Eskalerte samtaler</p>
                <p>Antall samtaler som er eskalert til menneskelig støtte.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-[100px]" />
        ) : (
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div className="text-2xl font-bold">{escalatedCount?.toLocaleString('no') ?? 0}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
