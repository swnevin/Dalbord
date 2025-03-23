
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Loader } from '@/components/ui/loader';
import { FeedbackTimeSeriesData } from './types';
import { ChartContainer } from '@/components/ui/chart/ChartContainer';
import { Smile, Meh, Frown } from 'lucide-react';

interface FeedbackChartProps {
  data: FeedbackTimeSeriesData[];
  title: string;
  description: string;
  isLoading: boolean;
  loadingText?: string;
}

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
              {entry.name === 'happy_face' ? 'Fornøyde 🙂' :
               entry.name === 'neutral_face' ? 'Nøytrale 😐' :
               entry.name === 'sad_face' ? 'Misfornøyde 🙁' : entry.name}:
              {' '}{entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom legend renderer with emojis
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
            {entry.value === 'happy_face' ? 'Fornøyde 🙂' :
             entry.value === 'neutral_face' ? 'Nøytrale 😐' :
             entry.value === 'sad_face' ? 'Misfornøyde 🙁' : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const FeedbackLineChart: React.FC<FeedbackChartProps> = ({
  data,
  title,
  description,
  isLoading,
  loadingText = 'Laster data...'
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader className="mb-4" />
            <p className="text-muted-foreground">{loadingText}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Ingen data tilgjengelig</p>
          </div>
        ) : (
          <div className="h-64">
            <ChartContainer config={{}} className="h-full">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                <Line 
                  type="monotone" 
                  dataKey="happy_face" 
                  name="happy_face" 
                  stroke="#28483F" 
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="neutral_face" 
                  name="neutral_face" 
                  stroke="#E2B808" 
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sad_face" 
                  name="sad_face" 
                  stroke="#8E9196" 
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
