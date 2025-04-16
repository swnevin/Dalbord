
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

interface SuccessMetricsCardsProps {
  successfulAnswerCount: number;
  fallbackCount: number;
  isLoading: boolean;
}

export const SuccessMetricsCards = ({ 
  successfulAnswerCount, 
  fallbackCount, 
  isLoading 
}: SuccessMetricsCardsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Vellykkede svar
          </CardTitle>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">Vellykkede svar</p>
                  <p>Antall ganger AI-assistenten ga et svar fra kunnskapsbasen.</p>
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
              {successfulAnswerCount.toLocaleString('no') ?? 0}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Fallback
          </CardTitle>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">Fallback</p>
                  <p>Antall spørsmål AI-assistenten ikke kunne svare på fordi informasjonen manglet i kunnskapsbasen.</p>
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
              {fallbackCount.toLocaleString('no') ?? 0}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
