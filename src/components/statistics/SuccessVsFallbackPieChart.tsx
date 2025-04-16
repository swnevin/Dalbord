
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
import { Progress } from '@/components/ui/progress';

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
  const successRate = total > 0 ? (successfulAnswerCount / total) * 100 : 0;

  const data = [
    { name: 'Vellykkede svar', value: successfulAnswerCount, color: '#10b981' }, // Success Green
    { name: 'Fallback', value: fallbackCount, color: '#f97316' }, // Fallback Orange
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
      <Card className="h-full min-h-[400px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Svar vs Fallback</CardTitle>
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

  if (total === 0) {
    return (
      <Card className="h-full min-h-[400px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Svar vs Fallback</CardTitle>
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
            <p className="text-muted-foreground">Ingen data tilgjengelig</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full min-h-[400px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Svar vs Fallback</CardTitle>
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
        <div className="flex flex-col gap-4">
          {/* Success rate indicator */}
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Suksessrate</div>
              <div className="text-lg font-semibold">{successRate.toFixed(1)}%</div>
            </div>
            <Progress
              value={successRate}
              className="h-2 mt-2"
              indicatorClassName={
                successRate >= 80 ? "bg-green-500" : 
                successRate >= 60 ? "bg-green-400" : 
                successRate >= 40 ? "bg-yellow-500" : 
                "bg-red-500"
              }
            />
          </div>
          
          <div className="h-56 flex items-center justify-center">
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
                  paddingAngle={2}
                  strokeWidth={3}
                  stroke="#ffffff"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="drop-shadow-sm"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ChartContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm">
              <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
              <span className="text-sm">{successfulAnswerCount} svar</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm">
              <div className="w-3 h-3 rounded-full bg-[#f97316]"></div>
              <span className="text-sm">{fallbackCount} fallbacks</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
