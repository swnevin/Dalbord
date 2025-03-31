
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

interface FeedbackSummaryCardsProps {
  escalatedCount: number;
  thumbsUpCount: number;
  thumbsDownCount: number;
  isLoading: boolean;
}

export const FeedbackSummaryCards = ({ 
  escalatedCount, 
  thumbsUpCount,
  thumbsDownCount,
  isLoading 
}: FeedbackSummaryCardsProps) => {
  return (
    <>
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
                  <p>Antall samtaler som ble eskalert til et menneske.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader size="sm" text="Laster data..." />
            </div>
          ) : (
            <div className="text-2xl font-bold">
              {escalatedCount.toLocaleString('no') ?? 0}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tommel opp
          </CardTitle>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">Tommel opp</p>
                  <p>Antall svar som fikk positiv tilbakemelding.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader size="sm" text="Laster data..." />
            </div>
          ) : (
            <div className="text-2xl font-bold">
              {thumbsUpCount.toLocaleString('no') ?? 0}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tommel ned
          </CardTitle>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">Tommel ned</p>
                  <p>Antall svar som fikk negativ tilbakemelding.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader size="sm" text="Laster data..." />
            </div>
          ) : (
            <div className="text-2xl font-bold">
              {thumbsDownCount.toLocaleString('no') ?? 0}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
