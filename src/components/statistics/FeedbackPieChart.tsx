
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader } from '@/components/ui/loader';

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
    { name: 'Fornøyde', value: happyFaceCount, color: '#4CAF50' },
    { name: 'Nøytrale', value: neutralFaceCount, color: '#E2B808' },
    { name: 'Misfornøyde', value: sadFaceCount, color: '#F44336' },
    { name: 'Ikke vurdert', value: notReviewedCount, color: '#E0E0E0' }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tilbakemeldinger</CardTitle>
        <CardDescription>Fordeling av brukernes tilbakemeldinger på samtaler</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || totalConversations === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader className="mb-4" />
            <p className="text-muted-foreground">Laster tilbakemeldingsdata...</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
