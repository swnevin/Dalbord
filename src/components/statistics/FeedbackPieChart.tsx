
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

interface FeedbackPieChartProps {
  happyFaceCount: number;
  neutralFaceCount: number;
  sadFaceCount: number;
  totalConversations: number;
  isLoading: boolean;
}

export const FeedbackPieChart: React.FC<FeedbackPieChartProps> = ({
  happyFaceCount,
  neutralFaceCount,
  sadFaceCount,
  totalConversations,
  isLoading
}) => {
  // Calculate the number of conversations without feedback
  const reviewedCount = happyFaceCount + neutralFaceCount + sadFaceCount;
  const notReviewedCount = Math.max(0, totalConversations - reviewedCount);

  const data = [
    { name: 'Fornøyde 🙂', value: happyFaceCount, color: '#28483F' }, // Primary Dark Green
    { name: 'Nøytrale 😐', value: neutralFaceCount, color: '#E2B808' }, // Accent Yellow
    { name: 'Misfornøyde 🙁', value: sadFaceCount, color: '#8E9196' }, // Neutral Gray
    { name: 'Ikke vurdert', value: notReviewedCount, color: '#F1F0FB' } // Soft Gray background
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = ((item.value / totalConversations) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm">{item.value} samtaler</p>
          <p className="text-sm">{percentage}% av totalen</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading || totalConversations === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Tilbakemeldinger</CardTitle>
          <TooltipProvider delayDuration={100}>
            <UITooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium">Tilbakemeldinger</p>
                  <p>Fordeling av brukernes tilbakemeldinger på samtaler</p>
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
        <CardTitle>Tilbakemeldinger</CardTitle>
        <TooltipProvider delayDuration={100}>
          <UITooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-2 max-w-xs">
                <p className="font-medium">Tilbakemeldinger</p>
                <p>Fordeling av brukernes tilbakemeldinger på samtaler</p>
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
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
