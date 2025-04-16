
import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { IntentData } from "./types";
import { InfoIcon } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

interface HighchartsBarChartProps {
  data: IntentData[] | undefined;
  title: string;
  description?: string;
  color?: string;
  isLoading: boolean;
  loadingText?: string;
  limit?: number;
  layout?: 'vertical' | 'horizontal';
  yAxisTitle?: string;
  xAxisTitle?: string;
}

export const HighchartsBarChart: React.FC<HighchartsBarChartProps> = ({
  data,
  title,
  description,
  color = "#28483F",
  isLoading,
  loadingText = "Laster data...",
  limit = 10,
  layout = 'horizontal',
  yAxisTitle = "Antall",
  xAxisTitle = "Kategori"
}) => {
  // Filter out categories starting with "VF." and take only the top N intents
  const filteredData = data 
    ? [...data]
        .filter(item => !item.name?.startsWith("VF."))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
    : [];

  // Dalai theme gradient colors from dark green to yellow
  const generateColors = () => {
    if (!filteredData || filteredData.length === 0) return [];
    
    const colors = [];
    const darkGreen = [40, 72, 63];  // RGB for #28483F
    const yellow = [226, 184, 8];    // RGB for #E2B808
    
    for (let i = 0; i < filteredData.length; i++) {
      const ratio = i / (filteredData.length - 1 || 1);
      const r = Math.round(darkGreen[0] + ratio * (yellow[0] - darkGreen[0]));
      const g = Math.round(darkGreen[1] + ratio * (yellow[1] - darkGreen[1]));
      const b = Math.round(darkGreen[2] + ratio * (yellow[2] - darkGreen[2]));
      colors.push(`rgb(${r}, ${g}, ${b})`);
    }
    
    return colors;
  };

  const prepareChartData = () => {
    if (!filteredData || filteredData.length === 0) return [];
    const colors = generateColors();
    
    return filteredData.map((item, index) => ({
      name: item.name,
      y: item.count,
      color: colors[index]
    }));
  };

  const chartOptions: Highcharts.Options = {
    chart: {
      type: layout === 'vertical' ? 'bar' : 'column',
      height: 300
    },
    title: {
      text: undefined
    },
    xAxis: {
      type: layout === 'vertical' ? 'category' : 'category',
      title: {
        text: layout === 'vertical' ? yAxisTitle : xAxisTitle
      },
      labels: {
        style: {
          fontSize: '11px'
        },
        ...(layout === 'horizontal' && {
          rotation: -45,
          align: 'right'
        })
      }
    },
    yAxis: {
      title: {
        text: layout === 'vertical' ? xAxisTitle : yAxisTitle
      },
      min: 0
    },
    legend: {
      enabled: false
    },
    tooltip: {
      headerFormat: '<span style="font-size:11px">{point.key}</span><br>',
      pointFormat: '<span style="color:{point.color}">\u25CF</span> <b>{point.y}</b><br/>'
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        dataLabels: {
          enabled: false
        }
      },
      column: {
        borderRadius: 4,
        dataLabels: {
          enabled: false
        }
      }
    },
    series: [{
      name: title,
      type: layout === 'vertical' ? 'bar' : 'column',
      data: prepareChartData(),
      colorByPoint: true
    }]
  };

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
      <CardContent className="h-[320px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader size="md" text={loadingText} />
          </div>
        ) : filteredData && filteredData.length > 0 ? (
          <HighchartsReact
            highcharts={Highcharts}
            options={chartOptions}
            containerProps={{ style: { height: '100%', width: '100%' } }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Ingen data tilgjengelig
          </div>
        )}
      </CardContent>
    </Card>
  );
};
