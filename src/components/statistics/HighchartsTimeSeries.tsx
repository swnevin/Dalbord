
import React, { useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { TimeSeriesData } from "./types";
import { InfoIcon } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

interface HighchartsTimeSeriesProps {
  data: TimeSeriesData[] | undefined;
  title: string;
  description?: string;
  color?: string;
  isLoading: boolean;
  loadingText?: string;
  yAxisTitle?: string;
  xAxisTitle?: string;
  chartType?: 'line' | 'spline' | 'area' | 'areaspline';
}

export const HighchartsTimeSeries: React.FC<HighchartsTimeSeriesProps> = ({
  data,
  title,
  description,
  color = "#28483F",
  isLoading,
  loadingText = "Laster data...",
  yAxisTitle = "Antall",
  xAxisTitle = "Dato",
  chartType = 'spline'
}) => {
  const prepareChartData = () => {
    if (!data || data.length === 0) return [];
    return data.map(item => [item.date, item.value]);
  };

  const chartOptions: Highcharts.Options = {
    chart: {
      type: chartType,
      height: 300,
      style: {
        fontFamily: 'Poppins, sans-serif'
      }
    },
    title: {
      text: undefined
    },
    xAxis: {
      type: 'category',
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
      headerFormat: '<span style="font-size:11px">{point.key}</span><br>',
      pointFormat: '<span style="color:{point.color}">\u25CF</span> <b>{point.y}</b><br/>'
    },
    plotOptions: {
      spline: {
        marker: {
          enabled: data && data.length <= 10
        }
      },
      area: {
        fillOpacity: 0.2
      },
      areaspline: {
        fillOpacity: 0.2
      }
    },
    series: [{
      name: title,
      type: chartType,
      data: prepareChartData(),
      color: color
    }],
    responsive: {
      rules: [{
        condition: {
          maxWidth: 500
        },
        chartOptions: {
          legend: {
            enabled: false
          },
          yAxis: {
            labels: {
              align: 'left',
              x: 0,
              y: -5
            }
          }
        }
      }]
    }
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
        ) : data && data.length > 0 ? (
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
