
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Tooltip,
  Legend,
  Text
} from 'recharts';
import { Loader } from '@/components/ui/loader';
import { SuccessVsFallbackTimeSeriesData } from './types';
import { ChartContainer } from '@/components/ui/chart/ChartContainer';
import { 
  Tooltip as UITooltip, 
  TooltipContent, 
  TooltipTrigger, 
  TooltipProvider 
} from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

interface SuccessVsFallbackChartProps {
  data: SuccessVsFallbackTimeSeriesData[];
  isLoading: boolean;
  loadingText?: string;
}

// Process data to ensure no undefined/null values and determine min/max values
const processChartData = (data: SuccessVsFallbackTimeSeriesData[]) => {
  // Make a deep copy to avoid modifying the original data
  const processedData = data.map(item => ({
    date: item.date,
    successful_answer: typeof item.successful_answer === 'number' ? item.successful_answer : 0,
    fallback: typeof item.fallback === 'number' ? item.fallback : 0
  }));

  // Calculate maximum value for better Y axis domain
  let maxValue = 0;
  processedData.forEach(item => {
    const totalValue = item.successful_answer + item.fallback;
    maxValue = Math.max(maxValue, totalValue, item.successful_answer, item.fallback);
  });

  return { 
    processedData, 
    maxValue: Math.max(maxValue, 1) // Ensure at least 1 to avoid empty chart
  };
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`tooltip-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">
              {entry.name === 'successful_answer' ? 'Vellykkede svar' :
               entry.name === 'fallback' ? 'Fallback' : entry.name}:
              {' '}{entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom legend renderer
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex justify-center gap-6 mt-2">
      {payload && payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm">
            {entry.value === 'successful_answer' ? 'Vellykkede svar' :
             entry.value === 'fallback' ? 'Fallback' : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Custom tick formatter for X axis
const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <Text 
      x={x} 
      y={y} 
      dy={16} 
      textAnchor="middle" 
      fill="#64748B" 
      fontSize={12}
    >
      {payload.value}
    </Text>
  );
};

export const SuccessVsFallbackLineChart: React.FC<SuccessVsFallbackChartProps> = ({
  data,
  isLoading,
  loadingText = 'Laster data...'
}) => {
  // Process data for chart display
  const { processedData, maxValue } = processChartData(data);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Svar vs Fallback over tid</CardTitle>
        <TooltipProvider delayDuration={100}>
          <UITooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-2 max-w-xs">
                <p className="font-medium">Svar vs Fallback over tid</p>
                <p>Utvikling av vellykkede svar vs fallback-svar over tid</p>
              </div>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader className="mb-4" />
            <p className="text-muted-foreground">{loadingText}</p>
          </div>
        ) : processedData.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Ingen data tilgjengelig</p>
          </div>
        ) : (
          <div className="h-64">
            <ChartContainer config={{}} className="h-full">
              <LineChart 
                data={processedData} 
                margin={{ top: 10, right: 30, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748B" 
                  fontSize={12} 
                  tickLine={false} 
                  padding={{ left: 15, right: 15 }}
                  height={40}
                  tick={CustomXAxisTick}
                />
                <YAxis 
                  stroke="#64748B" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false}
                  domain={[0, Math.ceil(maxValue * 1.2)]} // Add 20% padding at the top
                  width={35}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                <Line 
                  type="monotone" 
                  dataKey="successful_answer" 
                  name="successful_answer" 
                  stroke="#28483F" 
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  dot={{ r: 4 }}
                  isAnimationActive={true}
                />
                <Line 
                  type="monotone" 
                  dataKey="fallback" 
                  name="fallback" 
                  stroke="#E2B808" 
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  dot={{ r: 4 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
