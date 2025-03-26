
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader } from '@/components/ui/loader';
import { ChartContainer } from '@/components/ui/chart/ChartContainer';
import { 
  Tooltip as UITooltip, 
  TooltipContent, 
  TooltipTrigger, 
  TooltipProvider 
} from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

interface SuccessVsFallbackPieChartProps {
  successfulAnswerCount: number;
  fallbackCount: number;
  isLoading: boolean;
}

export const SuccessVsFallbackPieChart: React.FC<SuccessVsFallbackPieChartProps> = ({
  successfulAnswerCount,
  fallbackCount,
  isLoading
}) => {
  const total = successfulAnswerCount + fallbackCount;
  const hasData = total > 0;

  const data = [
    { name: 'Vellykkede svar', value: successfulAnswerCount, color: '#28483F' }, // Primary Dark Green
    { name: 'Fallback', value: fallbackCount, color: '#E2B808' }, // Accent Yellow
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = ((item.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm">{item.value} tilfeller</p>
          <p className="text-sm">{percentage}% av totalen</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Svar vs Fallback</CardTitle>
          <TooltipProvider delayDuration={100}>
            <UITooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">Svar vs Fallback</p>
                  <p>Fordeling av vellykkede svar vs fallback-svar</p>
                </div>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64">
            <Loader className="mb-4" />
            <p className="text-muted-foreground">Laster svar/fallback-data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Svar vs Fallback</CardTitle>
          <TooltipProvider delayDuration={100}>
            <UITooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">Svar vs Fallback</p>
                  <p>Fordeling av vellykkede svar vs fallback-svar</p>
                </div>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground">Ingen svar/fallback-data tilgjengelig</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Svar vs Fallback</CardTitle>
        <TooltipProvider delayDuration={100}>
          <UITooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-2 max-w-xs">
                <p className="font-medium">Svar vs Fallback</p>
                <p>Fordeling av vellykkede svar vs fallback-svar</p>
              </div>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center">
          <ChartContainer 
            config={{}} 
            className="h-full w-full flex items-center justify-center"
          >
            <RechartsPieChart width={250} height={250} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                dataKey="value"
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
