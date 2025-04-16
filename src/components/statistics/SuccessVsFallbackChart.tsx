
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
  ComposedChart,
  Bar,
  Area
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
import { InfoIcon, BarChart2, LineChart as LineChartIcon } from 'lucide-react';
import { useState } from 'react';

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
    fallback: typeof item.fallback === 'number' ? item.fallback : 0,
    // Add success rate calculation
    success_rate: item.successful_answer + item.fallback > 0 
      ? (item.successful_answer / (item.successful_answer + item.fallback)) * 100 
      : 0
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
    // Get success rate for this data point if available
    const successRateItem = payload.find(p => p.dataKey === 'success_rate');
    const successRate = successRateItem ? successRateItem.value : null;
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
        <p className="font-bold mb-2">{label}</p>
        {payload.filter(p => p.dataKey !== 'success_rate').map((entry: any, index: number) => (
          <div key={`tooltip-${index}`} className="flex items-center gap-2 mb-1">
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
        {successRate !== null && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <span className="text-sm font-medium">Suksessrate: {successRate.toFixed(1)}%</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const SuccessVsFallbackLineChart: React.FC<SuccessVsFallbackChartProps> = ({
  data,
  isLoading,
  loadingText = 'Laster data...'
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area');
  
  // Process data for chart display
  const { processedData, maxValue } = processChartData(data);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1">
          <CardTitle className="text-base font-medium">Svar vs Fallback over tid</CardTitle>
          <div className="flex space-x-2 text-xs">
            <button 
              onClick={() => setChartType('line')}
              className={`px-2 py-0.5 rounded ${chartType === 'line' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
            >
              Linje
            </button>
            <button 
              onClick={() => setChartType('area')}
              className={`px-2 py-0.5 rounded ${chartType === 'area' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
            >
              Område
            </button>
            <button 
              onClick={() => setChartType('bar')}
              className={`px-2 py-0.5 rounded ${chartType === 'bar' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
            >
              Stolpe
            </button>
          </div>
        </div>
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
              <ComposedChart 
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
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#64748B" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false}
                  domain={[0, Math.ceil(maxValue * 1.2)]} // Add 20% padding at the top
                  width={35}
                />
                {/* Add a secondary Y-axis for success rate percentage */}
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748B" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false}
                  domain={[0, 100]} 
                  unit="%"
                  width={35}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Show different chart types based on selection */}
                {chartType === 'line' && (
                  <>
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="successful_answer" 
                      name="successful_answer" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                      dot={{ r: 4 }}
                      isAnimationActive={true}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="fallback" 
                      name="fallback" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                      dot={{ r: 4 }}
                      isAnimationActive={true}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="success_rate" 
                      name="success_rate" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      isAnimationActive={true}
                    />
                  </>
                )}
                
                {chartType === 'area' && (
                  <>
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="successful_answer" 
                      name="successful_answer" 
                      stroke="#10b981" 
                      fill="#10b98120"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                      isAnimationActive={true}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="fallback" 
                      name="fallback" 
                      stroke="#f97316" 
                      fill="#f9731620"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                      isAnimationActive={true}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="success_rate" 
                      name="success_rate" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      isAnimationActive={true}
                    />
                  </>
                )}
                
                {chartType === 'bar' && (
                  <>
                    <Bar 
                      yAxisId="left"
                      dataKey="successful_answer" 
                      name="successful_answer" 
                      fill="#10b981"
                      strokeWidth={0}
                      barSize={20}
                      isAnimationActive={true}
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="fallback" 
                      name="fallback" 
                      fill="#f97316" 
                      strokeWidth={0}
                      barSize={20}
                      isAnimationActive={true}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="success_rate" 
                      name="success_rate" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      isAnimationActive={true}
                    />
                  </>
                )}
                
                <Legend 
                  payload={[
                    { value: 'Vellykkede svar', type: 'square', color: '#10b981' },
                    { value: 'Fallback', type: 'square', color: '#f97316' },
                    { value: 'Suksessrate %', type: 'line', color: '#6366f1' }
                  ]}
                  verticalAlign="bottom"
                  height={36}
                />
              </ComposedChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
