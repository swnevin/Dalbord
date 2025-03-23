
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessagesSquare, UserRound, InfoIcon, MessageCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

interface SummaryCardsProps {
  totalMessages: number;
  totalSessions: number;
  totalConversations: number;
  isLoading: boolean;
}

export const SummaryCards = ({ totalMessages, totalSessions, totalConversations, isLoading }: SummaryCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Antall meldinger
          </CardTitle>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">Antall meldinger</p>
                  <p>Det totale antallet meldinger som er sendt gjennom systemet i den valgte tidsperioden.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader size="sm" text="Laster meldingsdata..." />
            </div>
          ) : (
            <div className="text-2xl font-bold">
              {totalMessages?.toLocaleString('no') ?? 0}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Antall samtaler
          </CardTitle>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">Antall samtaler</p>
                  <p>Det totale antallet samtaler (økter) gjennomført i systemet i den valgte tidsperioden.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader size="sm" text="Laster samtaledata..." />
            </div>
          ) : (
            <div className="text-2xl font-bold">
              {totalSessions?.toLocaleString('no') ?? 0}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Antall Brukere
          </CardTitle>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">Antall brukere</p>
                  <p>Det totale antallet unike brukere som har interagert med systemet i den valgte tidsperioden.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader size="sm" text="Laster brukerdata..." />
            </div>
          ) : (
            <div className="text-2xl font-bold">
              {totalConversations?.toLocaleString('no') ?? 0}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
