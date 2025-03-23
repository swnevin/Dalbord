
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell
} from "recharts";
import { IntentData } from "./types";
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

interface BarChartProps {
  data: IntentData[] | undefined;
  title: string;
  description?: string;
  color?: string;
  isLoading: boolean;
  loadingText?: string;
  limit?: number;
}

export const BarChart = ({
  data,
  title,
  description,
  color = "#28483F",
  isLoading,
  loadingText = "Laster data...",
  limit = 10
}: BarChartProps) => {
  // Filter out categories starting with "VF." and take only the top N intents
  const filteredData = data 
    ? [...data]
        .filter(item => !item.name.startsWith("VF."))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
    : [];
  
  // Dalai theme gradient colors from dark green to yellow
  const colors = [
    "#28483F", // Primary Dark Green
    "#34584C",
    "#406858",
    "#4C7965",
    "#588972",
    "#64997E",
    "#70AA8B",
    "#7CBA98",
    "#88CAA4",
    "#9ADAB1",
    "#ABEBBD",
    "#BDF0C5",
    "#CEF5CD",
    "#E0FAD6",
    "#E2B808"  // Accent Yellow
  ];

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
        ) : filteredData && filteredData.length > 0 ? (
          <ChartContainer 
            config={{
              value: { color }
            }}
            className="h-[300px]"
          >
            <RechartsBarChart
              data={filteredData}
              margin={{ top: 10, right: 30, left: 40, bottom: 60 }}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={true} />
              <XAxis
                type="category"
                dataKey="name"
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={true}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis
                type="number"
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={({active, payload, label}) => 
                  active && payload && payload.length ? (
                    <ChartTooltipContent 
                      active={active} 
                      payload={payload} 
                      label={label}
                      formatter={(value: number, name: string) => [
                        `${value}`, 
                        name === "count" ? " Antall" : name
                      ]}
                    />
                  ) : null
                }
              />
              <Bar
                dataKey="count"
                name="Antall"
                animationDuration={1500}
                animationEasing="ease-in-out"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              >
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Ingen data tilgjengelig
          </div>
        )}
      </CardContent>
    </Card>
  );
};
