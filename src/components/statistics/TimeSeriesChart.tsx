
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  Area,
  AreaChart
} from "recharts";
import { TimeSeriesData } from "./types";
import { InfoIcon } from "lucide-react";
import { 
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent 
} from "@/components/ui/chart";
import { useState } from "react";

interface TimeSeriesChartProps {
  data: TimeSeriesData[] | undefined;
  title: string;
  description?: string;
  color?: string;
  isLoading: boolean;
  loadingText?: string;
}

export const TimeSeriesChart = ({
  data,
  title,
  description,
  color = "#28483F",
  isLoading,
  loadingText = "Laster data..."
}: TimeSeriesChartProps) => {
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  
  // Calculate the average value
  const calculateAverage = (data: TimeSeriesData[] | undefined): number => {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + item.value, 0);
    return sum / data.length;
  };
  
  const averageValue = calculateAverage(data);
  
  // Find the max value for better chart visualization
  const findMaxValue = (data: TimeSeriesData[] | undefined): number => {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map(item => item.value));
  };
  
  const maxValue = findMaxValue(data);
  
  // Set Y-axis domain to include some padding above the max value
  const yAxisDomain = [0, Math.ceil(maxValue * 1.2)];

  return (
    <Card className="w-full bg-white dark:bg-gray-950">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {/* Add click handlers for toggling chart type */}
          <div className="flex space-x-2 text-xs">
            <button 
              onClick={() => setChartType('line')}
              className={`px-2 py-0.5 rounded ${chartType === 'line' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
            >
              Linjediagram
            </button>
            <button 
              onClick={() => setChartType('area')}
              className={`px-2 py-0.5 rounded ${chartType === 'area' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
            >
              Områdediagram
            </button>
          </div>
        </div>
        {description && (
          <TooltipProvider delayDuration={100}>
            <UITooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">{title}</p>
                  <p>{description}</p>
                </div>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        )}
      </CardHeader>
      <CardContent className="h-[320px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader size="md" text={loadingText} />
          </div>
        ) : data && data.length > 0 ? (
          <ChartContainer 
            config={{
              value: { color }
            }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart 
                  data={data}
                  margin={{ top: 20, right: 20, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748B"
                    fontSize={12}
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval="preserveStartEnd"
                    minTickGap={30}
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={yAxisDomain}
                  />
                  <Tooltip
                    content={({active, payload, label}) => 
                      active && payload && payload.length ? (
                        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
                          <p className="font-bold mb-1">{label}</p>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span>{payload[0].value} {title.toLowerCase()}</span>
                          </div>
                        </div>
                      ) : null
                    }
                  />
                  <ReferenceLine 
                    y={averageValue} 
                    stroke="#64748B" 
                    strokeDasharray="3 3" 
                    label={{ 
                      value: `Snitt: ${averageValue.toFixed(1)}`, 
                      position: 'right',
                      fill: '#64748B',
                      fontSize: 12
                    }} 
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    dot={data.length <= 30}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              ) : (
                <AreaChart 
                  data={data}
                  margin={{ top: 20, right: 20, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748B"
                    fontSize={12}
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval="preserveStartEnd"
                    minTickGap={30}
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={yAxisDomain}
                  />
                  <Tooltip
                    content={({active, payload, label}) => 
                      active && payload && payload.length ? (
                        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
                          <p className="font-bold mb-1">{label}</p>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span>{payload[0].value} {title.toLowerCase()}</span>
                          </div>
                        </div>
                      ) : null
                    }
                  />
                  <ReferenceLine 
                    y={averageValue} 
                    stroke="#64748B" 
                    strokeDasharray="3 3" 
                    label={{ 
                      value: `Snitt: ${averageValue.toFixed(1)}`, 
                      position: 'right',
                      fill: '#64748B',
                      fontSize: 12
                    }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    fill={`${color}25`}
                    strokeWidth={2}
                    dot={data.length <= 30}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Ingen data tilgjengelig
          </div>
        )}
      </CardContent>
    </Card>
  );
};
