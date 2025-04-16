
import Highcharts from 'highcharts';

// Import additional Highcharts modules if needed
import HighchartsMore from 'highcharts/highcharts-more';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsExportData from 'highcharts/modules/export-data';
import HighchartsAccessibility from 'highcharts/modules/accessibility';

// Apply modules to Highcharts
HighchartsMore(Highcharts);
HighchartsExporting(Highcharts);
HighchartsExportData(Highcharts);
HighchartsAccessibility(Highcharts);

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
