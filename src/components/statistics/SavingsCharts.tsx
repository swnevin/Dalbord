
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { InfoIcon } from "lucide-react";

interface SavingsChartsProps {
  timeSaved: number; // in minutes
  moneySaved: number; // in NOK
  isLoading: boolean;
  timePerMessage: number; // in minutes
  hourlyRate: number; // in NOK
  onSettingsChange: (settings: { timePerMessage: number; hourlyRate: number }) => void;
  totalMessages: number;
}

export const SavingsCharts = ({
  timeSaved,
  moneySaved,
  isLoading,
  timePerMessage,
  hourlyRate,
  onSettingsChange,
  totalMessages,
}: SavingsChartsProps) => {
  const [localTimePerMessage, setLocalTimePerMessage] = useState(timePerMessage.toString());
  const [localHourlyRate, setLocalHourlyRate] = useState(hourlyRate.toString());

  useEffect(() => {
    setLocalTimePerMessage(timePerMessage.toString());
    setLocalHourlyRate(hourlyRate.toString());
  }, [timePerMessage, hourlyRate]);

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

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalTimePerMessage(value);
    const numValue = parseFloat(value) || 0;
    if (numValue > 0) {
      onSettingsChange({ timePerMessage: numValue, hourlyRate });
    }
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalHourlyRate(value);
    const numValue = parseFloat(value) || 0;
    if (numValue > 0) {
      onSettingsChange({ timePerMessage, hourlyRate: numValue });
    }
  };

  const timeTooltipContent = (
    <div className="space-y-2 max-w-xs">
      <p className="font-medium">Beregning av tid spart</p>
      <p>Tiden spart er beregnet basert på gjennomsnittlig tid brukt per melding multiplisert med totalt antall meldinger.</p>
      <div className="pt-1">
        <p>Formel: {totalMessages} meldinger × {timePerMessage} minutter</p>
        <p>= {formatTime(timeSaved)}</p>
      </div>
    </div>
  );

  const moneyTooltipContent = (
    <div className="space-y-2 max-w-xs">
      <p className="font-medium">Beregning av penger spart</p>
      <p>Penger spart er beregnet basert på total tid spart multiplisert med gjennomsnittlig timelønn.</p>
      <div className="pt-1">
        <p>Formel: {(timeSaved / 60).toFixed(2)} timer × {hourlyRate} kr/time</p>
        <p>= {formatMoney(moneySaved)}</p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Timer spart
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>{timeTooltipContent}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader size="sm" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {formatTime(timeSaved)}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                <span>Per melding:</span>
                <Input
                  type="number" 
                  value={localTimePerMessage}
                  onChange={handleTimeChange}
                  className="h-6 w-16 text-xs"
                  min="0.1"
                  step="0.1"
                />
                <span>min</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Penger spart
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>{moneyTooltipContent}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader size="sm" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-secondary">
                {formatMoney(moneySaved)}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                <span>Timelønn:</span>
                <Input
                  type="number"
                  value={localHourlyRate}
                  onChange={handleRateChange}
                  className="h-6 w-16 text-xs"
                  min="1"
                  step="1"
                />
                <span>kr/t</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
