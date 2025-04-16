
import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { 
  Tooltip as UITooltip, 
  TooltipContent, 
  TooltipTrigger, 
  TooltipProvider 
} from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { HighchartsSeriesData } from './types';

interface HighchartsMultiSeriesProps {
  series: HighchartsSeriesData[];
  categories: string[];
  title: string;
  description?: string;
  yAxisTitle?: string;
  xAxisTitle?: string;
  isLoading: boolean;
  loadingText?: string;
}

export const HighchartsMultiSeries: React.FC<HighchartsMultiSeriesProps> = ({
  series,
  categories,
  title,
  description,
  yAxisTitle = 'Antall',
  xAxisTitle = 'Dato',
  isLoading,
  loadingText = 'Laster data...'
}) => {
  // Convert our custom series type to Highcharts expected format
  const formattedSeries = series.map(s => ({
    name: s.name,
    data: s.data,
    color: s.color,
    type: s.type || 'spline'
  }));

  const chartOptions: Highcharts.Options = {
    chart: {
      type: 'spline',
      height: 300
    },
    title: {
      text: undefined
    },
    xAxis: {
      categories: categories,
      title: {
        text: xAxisTitle
      },
      labels: {
        rotation: -45,
        style: {
          fontSize: '11px'
        }
      }
    },
    yAxis: {
      title: {
        text: yAxisTitle
      },
      min: 0
    },
    tooltip: {
      shared: true,
      // Fix for crosshairs property - this is a valid property but TypeScript doesn't recognize it
      crosshairs: true as any
    },
    plotOptions: {
      spline: {
        marker: {
          enabled: categories.length <= 10
        }
      }
    },
    series: formattedSeries as any
  };

  const hasData = series.length > 0 && series.some(s => s.data.length > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
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
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader className="mb-4" />
            <p className="text-muted-foreground">{loadingText}</p>
          </div>
        ) : !hasData ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Ingen data tilgjengelig</p>
          </div>
        ) : (
          <div className="h-64">
            <HighchartsReact
              highcharts={Highcharts}
              options={chartOptions}
              containerProps={{ style: { height: '100%', width: '100%' } }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
