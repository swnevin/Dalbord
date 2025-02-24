
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TimeSeriesData } from "./types";

interface TimeSeriesChartProps {
  data: TimeSeriesData[] | undefined;
  title: string;
  color?: string;
  isLoading: boolean;
}

export const TimeSeriesChart = ({
  data,
  title,
  color = "#28483F",
  isLoading
}: TimeSeriesChartProps) => {
  return (
    <Card className="w-full h-[400px]">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader size="md" />
          </div>
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="date"
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                }}
                formatter={(value: number) => [`Verdi: ${value}`, '']}
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
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Ingen data tilgjengelig
          </div>
        )}
      </CardContent>
    </Card>
  );
};
