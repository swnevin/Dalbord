
import Highcharts from 'highcharts';

// Define Dalai brand colors
const colors = {
  darkGreen: '#28483F',
  yellow: '#E2B808',
  lightGreen: '#3A5F55',
  neutral: '#8E9196',
  lightGray: '#F1F0FB',
  white: '#FFFFFF',
  backgroundPrimary: '#FFFFFF',
  textPrimary: '#374151',
  border: '#E2E8F0'
};

// Apply Dalai theme to Highcharts
const applyDalaiTheme = () => {
  Highcharts.theme = {
    colors: [
      colors.darkGreen, 
      colors.yellow, 
      colors.lightGreen, 
      colors.neutral, 
      '#7cb5ec', 
      '#90ed7d', 
      '#f7a35c', 
      '#8085e9'
    ],
    chart: {
      backgroundColor: colors.backgroundPrimary,
      style: {
        fontFamily: '"Poppins", "Inter", sans-serif'
      },
      borderRadius: 8,
      spacingBottom: 15,
      spacingTop: 15,
      spacingLeft: 15,
      spacingRight: 15
    },
    title: {
      style: {
        color: colors.textPrimary,
        fontWeight: '600',
        fontSize: '14px'
      }
    },
    subtitle: {
      style: {
        color: colors.neutral,
        fontSize: '12px'
      }
    },
    xAxis: {
      gridLineColor: colors.border,
      gridLineWidth: 0,
      lineColor: colors.border,
      tickColor: colors.border,
      labels: {
        style: {
          color: colors.neutral,
          fontSize: '12px'
        }
      },
      title: {
        style: {
          color: colors.textPrimary
        }
      }
    },
    yAxis: {
      gridLineColor: colors.border,
      lineColor: colors.border,
      tickColor: colors.border,
      tickWidth: 1,
      labels: {
        style: {
          color: colors.neutral,
          fontSize: '12px'
        }
      },
      title: {
        style: {
          color: colors.textPrimary,
          fontSize: '13px'
        }
      }
    },
    tooltip: {
      backgroundColor: colors.white,
      borderColor: colors.border,
      borderRadius: 6,
      borderWidth: 1,
      shadow: true,
      style: {
        color: colors.textPrimary,
        fontSize: '12px',
        padding: '12px'
      }
    },
    legend: {
      backgroundColor: colors.backgroundPrimary,
      itemStyle: {
        color: colors.textPrimary,
        fontWeight: 'normal',
        fontSize: '12px'
      },
      itemHoverStyle: {
        color: colors.darkGreen
      }
    },
    plotOptions: {
      line: {
        marker: {
          enabled: false
        }
      },
      spline: {
        marker: {
          enabled: false
        }
      },
      area: {
        marker: {
          enabled: false
        }
      },
      areaspline: {
        marker: {
          enabled: false
        }
      },
      pie: {
        borderWidth: 3,
        borderColor: colors.white,
        dataLabels: {
          style: {
            textOutline: 'none'
          }
        }
      },
      series: {
        animation: {
          duration: 1000
        },
        states: {
          hover: {
            brightness: 0.1
          }
        }
      }
    },
    credits: {
      enabled: false
    }
  };

  // Apply the theme
  Highcharts.setOptions(Highcharts.theme);
};

export default applyDalaiTheme;
