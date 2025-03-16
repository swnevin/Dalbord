
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

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

  const renderTimeFormula = () => (
    <div className="text-xs text-muted-foreground mt-2">
      <div className="font-medium">Formel:</div>
      <div className="flex items-center gap-2 mt-1">
        <span>Timer spart = {totalMessages} meldinger ×</span>
        <div className="flex items-center gap-1">
          <Input
            type="number" 
            value={localTimePerMessage}
            onChange={handleTimeChange}
            className="h-6 w-16 text-xs"
            min="0.1"
            step="0.1"
          />
          <span>minutter</span>
        </div>
      </div>
    </div>
  );

  const renderMoneyFormula = () => (
    <div className="text-xs text-muted-foreground mt-2">
      <div className="font-medium">Formel:</div>
      <div className="mt-1">Penger spart = Timer spart × Timelønn</div>
      <div className="flex items-center gap-2 mt-1">
        <span>= {(timeSaved / 60).toFixed(2)} timer ×</span>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={localHourlyRate}
            onChange={handleRateChange}
            className="h-6 w-16 text-xs"
            min="1"
            step="1"
          />
          <span>kr/time</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Timer spart
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[100px] flex items-center justify-center">
              <Loader size="md" />
            </div>
          ) : (
            <div>
              <div className="text-2xl font-bold text-primary">
                {formatTime(timeSaved)}
              </div>
              {renderTimeFormula()}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Penger spart
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[100px] flex items-center justify-center">
              <Loader size="md" />
            </div>
          ) : (
            <div>
              <div className="text-2xl font-bold text-accent-foreground">
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
