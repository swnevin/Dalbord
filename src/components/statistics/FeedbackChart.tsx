
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, TooltipProps } from 'recharts';
import { Loader } from '@/components/ui/loader';
import { FeedbackTimeSeriesData } from './types';

interface FeedbackChartProps {
  data: FeedbackTimeSeriesData[];
  title: string;
  description: string;
  isLoading: boolean;
  loadingText?: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`tooltip-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">
              {entry.name === 'happy_face' ? 'Fornøyde' :
               entry.name === 'neutral_face' ? 'Nøytrale' :
               entry.name === 'sad_face' ? 'Misfornøyde' : entry.name}:
              {' '}{entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const FeedbackChart: React.FC<FeedbackChartProps> = ({
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="happy_face" 
                  name="Fornøyde" 
                  stackId="a" 
                  fill="#4CAF50" 
                />
                <Bar 
                  dataKey="neutral_face" 
                  name="Nøytrale" 
                  stackId="a" 
                  fill="#E2B808" 
                />
                <Bar 
                  dataKey="sad_face" 
                  name="Misfornøyde" 
                  stackId="a" 
                  fill="#F44336" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
