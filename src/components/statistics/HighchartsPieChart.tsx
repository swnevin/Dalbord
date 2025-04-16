
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

interface PieChartData {
  name: string;
  y: number;
  color?: string;
}

interface HighchartsPieChartProps {
  data: PieChartData[];
  title: string;
  description?: string;
  isLoading: boolean;
  loadingText?: string;
  innerSize?: string;
  showLegend?: boolean;
}

export const HighchartsPieChart: React.FC<HighchartsPieChartProps> = ({
  data,
  title,
  description,
  isLoading,
  loadingText = 'Laster data...',
  innerSize = '50%',
  showLegend = true
}) => {
  const chartOptions: Highcharts.Options = {
    chart: {
      type: 'pie',
      height: 300
    },
    title: {
      text: undefined
    },
    tooltip: {
      pointFormat: '{point.name}: <b>{point.percentage:.1f}%</b> ({point.y})'
    },
    accessibility: {
      point: {
        valueSuffix: '%'
      }
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        innerSize: innerSize,
        depth: 35,
        dataLabels: {
          enabled: false
        },
        showInLegend: showLegend,
        borderWidth: 3,
        borderColor: '#FFFFFF'
      }
    },
    legend: {
      enabled: showLegend,
      layout: 'horizontal',
      align: 'center',
      verticalAlign: 'bottom',
      itemStyle: {
        fontSize: '12px'
      }
    },
    series: [{
      type: 'pie',
      name: title,
      data: data
    }]
  };

  const hasTotalValue = data.reduce((sum, item) => sum + item.y, 0) > 0;

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
        ) : (!hasTotalValue) ? (
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
