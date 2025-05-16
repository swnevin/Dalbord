
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader } from '@/components/ui/loader';
import { ChartContainer } from '@/components/ui/chart/ChartContainer';
import { 
  Tooltip as UITooltip, 
  TooltipContent, 
  TooltipTrigger, 
  TooltipProvider 
} from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

interface AddToCartChartProps {
  timeSeries: Array<{
    date: string;
    add_to_cart: number;
  }>;
  totalCount: number;
  isLoading: boolean;
}

export const AddToCartChart: React.FC<AddToCartChartProps> = ({
  timeSeries,
  totalCount,
  isLoading
}) => {
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          <p className="text-sm">{payload[0].value} legg til i handlekurv</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Legg til i handlekurv</CardTitle>
          <TooltipProvider delayDuration={100}>
            <UITooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">Legg til i handlekurv</p>
                  <p>Antall ganger brukere har lagt produkter i handlekurven</p>
                </div>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64">
            <Loader className="mb-4" />
            <p className="text-muted-foreground">Laster handlekurv-statistikk...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Legg til i handlekurv</CardTitle>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
            Totalt: {totalCount}
          </div>
          <TooltipProvider delayDuration={100}>
            <UITooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">Legg til i handlekurv</p>
                  <p>Antall ganger brukere har lagt produkter i handlekurven</p>
                </div>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ChartContainer 
            config={{}} 
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timeSeries}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickMargin={10} 
                  stroke="#94a3b8"
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fontSize: 12 }} 
                  tickMargin={10} 
                  stroke="#94a3b8"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="add_to_cart"
                  name="Legg til i handlekurv"
                  stroke="#E2B808"
                  activeDot={{ r: 6 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
