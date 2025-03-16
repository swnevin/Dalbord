
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDuration } from "date-fns";
import { nb } from "date-fns/locale";

interface SavingsChartsProps {
  timeSaved: number; // in minutes
  moneySaved: number; // in NOK
  isLoading: boolean;
  timePerMessage: number; // in minutes
  hourlyRate: number; // in NOK
}

export const SavingsCharts = ({
  timeSaved,
  moneySaved,
  isLoading,
  timePerMessage,
  hourlyRate,
}: SavingsChartsProps) => {
  // Format time saved
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    
    if (hours === 0) {
      return `${remainingMinutes} minutter`;
    } else if (remainingMinutes === 0) {
      return `${hours} timer`;
    } else {
      return `${hours} timer og ${remainingMinutes} minutter`;
    }
  };

  // Format money saved
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderTimeFormula = () => (
    <div className="text-sm text-muted-foreground mt-2">
      <div className="font-semibold">Formel:</div>
      <div>Timer spart = Antall meldinger × Tid per melding</div>
      <div className="mt-1">
        = {timeSaved / timePerMessage} meldinger × {timePerMessage} minutter
        = {formatTime(timeSaved)}
      </div>
    </div>
  );

  const renderMoneyFormula = () => (
    <div className="text-sm text-muted-foreground mt-2">
      <div className="font-semibold">Formel:</div>
      <div>Penger spart = Timer spart × Timelønn</div>
      <div className="mt-1">
        = {(timeSaved / 60).toFixed(2)} timer × {hourlyRate} kr/time
        = {formatMoney(moneySaved)}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              Timer spart
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon size={16} className="ml-2 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Beregnet basert på {timePerMessage} minutter per melding</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Loader size="md" />
            </div>
          ) : (
            <div>
              <div className="text-4xl font-bold text-primary">
                {formatTime(timeSaved)}
              </div>
              {renderTimeFormula()}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              Penger spart
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon size={16} className="ml-2 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Beregnet basert på {hourlyRate} kr/time</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Loader size="md" />
            </div>
          ) : (
            <div>
              <div className="text-4xl font-bold text-accent-foreground">
                {formatMoney(moneySaved)}
              </div>
              {renderMoneyFormula()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
