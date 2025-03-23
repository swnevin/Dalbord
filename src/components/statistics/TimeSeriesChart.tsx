
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { TimeSeriesData } from "./types";
import { InfoIcon } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent 
} from "@/components/ui/chart";

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
  return (
    <Card className="w-full h-[400px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">{title}</p>
                  <p>{description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader size="md" text={loadingText} />
          </div>
        ) : data && data.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={data}
                margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <ChartTooltip
                  content={({active, payload, label}) => 
                    active && payload && payload.length ? (
                      <ChartTooltipContent 
                        active={active} 
                        payload={payload} 
                        label={label}
                        formatter={(value: number) => [`Verdi: ${value}`, '']}
                      />
                    ) : null
                  }
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={data.length <= 30}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Ingen data tilgjengelig
          </div>
        )}
      </CardContent>
    </Card>
  );
};
