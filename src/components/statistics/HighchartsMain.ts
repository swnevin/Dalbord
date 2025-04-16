
import Highcharts from 'highcharts';

// Import additional Highcharts modules correctly
import HighchartsMore from 'highcharts/highcharts-more';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsExportData from 'highcharts/modules/export-data';
import HighchartsAccessibility from 'highcharts/modules/accessibility';

// Apply modules to Highcharts (fix the function call format)
if (typeof HighchartsMore === 'object') {
  HighchartsMore(Highcharts);
}
if (typeof HighchartsExporting === 'object') {
  HighchartsExporting(Highcharts);
}
if (typeof HighchartsExportData === 'object') {
  HighchartsExportData(Highcharts);
}
if (typeof HighchartsAccessibility === 'object') {
  HighchartsAccessibility(Highcharts);
}

// Re-export the theme and components
import applyDalaiTheme from './HighchartsTheme';
import { HighchartsTimeSeries } from './HighchartsTimeSeries';
import { HighchartsBarChart } from './HighchartsBarChart';
import { HighchartsPieChart } from './HighchartsPieChart';
import { HighchartsMultiSeries } from './HighchartsMultiSeries';

// Initialize the theme
applyDalaiTheme();

export {
  Highcharts,
  applyDalaiTheme,
  HighchartsTimeSeries,
  HighchartsBarChart,
  HighchartsPieChart,
  HighchartsMultiSeries
};
