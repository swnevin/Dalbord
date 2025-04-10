
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
import { InfoIcon, ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';

interface FeedbackPieChartProps {
  thumbsUpCount: number;
  thumbsDownCount: number;
  successfulAnswerCount: number;
  isLoading: boolean;
}

export const FeedbackPieChart: React.FC<FeedbackPieChartProps> = ({
  thumbsUpCount,
  thumbsDownCount,
  successfulAnswerCount,
  isLoading
}) => {
  // Calculate the number of answers without feedback
  const reviewedCount = thumbsUpCount + thumbsDownCount;
  const notReviewedCount = Math.max(0, successfulAnswerCount - reviewedCount);

  const data = [
    { name: 'Tommel opp 👍', value: thumbsUpCount, color: '#28483F', icon: ThumbsUp }, // Primary Dark Green
    { name: 'Tommel ned 👎', value: thumbsDownCount, color: '#8E9196', icon: ThumbsDown }, // Neutral Gray
    { name: 'Ikke vurdert ❔', value: notReviewedCount, color: '#F1F0FB', icon: HelpCircle } // Soft Gray background
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = ((item.value / Math.max(1, successfulAnswerCount)) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm">{item.value} svar</p>
          <p className="text-sm">{percentage}% av totalen</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading || successfulAnswerCount === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tilbakemeldinger på svar</CardTitle>
          <TooltipProvider delayDuration={100}>
            <UITooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">Tilbakemeldinger på svar</p>
                  <p>Fordeling av brukernes tilbakemeldinger på svar</p>
                </div>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64">
            <Loader className="mb-4" />
            <p className="text-muted-foreground">Laster tilbakemeldingsdata...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Tilbakemeldinger på svar</CardTitle>
        <TooltipProvider delayDuration={100}>
          <UITooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-2 max-w-xs">
                <p className="font-medium">Tilbakemeldinger på svar</p>
                <p>Fordeling av brukernes tommel opp/ned tilbakemeldinger på svar</p>
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
                paddingAngle={2}
                strokeWidth={3}
                stroke="#ffffff"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    className="drop-shadow-md"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPieChart>
          </ChartContainer>
        </div>
        <div className="flex justify-center gap-6 mt-6">
          {data.map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center gap-2 bg-white p-1.5 px-3 rounded-full shadow-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm">{entry.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
