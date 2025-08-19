import { useMemo } from 'react';
import { useTheme } from '@/constants/theme';

export const useChartTheme = () => {
  const { colors } = useTheme();

  const chartTheme = useMemo(() => ({
    chart: {
      width: 350,
      height: 350,
      padding: { left: 70, bottom: 60, right: 40, top: 20 },
    },
    axis: {
      style: {
        axis: {
          stroke: colors.border,
          strokeWidth: 1,
        },
        axisLabel: {
          fontSize: 14,
          padding: 30,
          fill: colors.textSecondary,
          fontWeight: '600',
        },
        grid: {
          stroke: colors.border,
          strokeWidth: 0.5,
          strokeDasharray: '3,3',
          strokeOpacity: 0.3,
        },
        ticks: {
          stroke: colors.border,
          size: 5,
          strokeWidth: 1,
        },
        tickLabels: {
          fontSize: 11,
          padding: 5,
          fill: colors.textSecondary,
          fontWeight: '400',
        },
      },
    },
    bar: {
      style: {
        data: {
          fill: colors.primary,
          strokeWidth: 0,
        },
        labels: {
          fontSize: 11,
          fill: colors.text,
          fontWeight: '500',
        },
      },
    },
    line: {
      style: {
        data: {
          stroke: colors.primary,
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        },
        labels: {
          fontSize: 11,
          fill: colors.text,
          fontWeight: '500',
        },
      },
    },
    area: {
      style: {
        data: {
          fill: colors.primary,
          fillOpacity: 0.3,
          stroke: colors.primary,
          strokeWidth: 2,
        },
        labels: {
          fontSize: 11,
          fill: colors.text,
          fontWeight: '500',
        },
      },
    },
    pie: {
      style: {
        data: {
          stroke: colors.background,
          strokeWidth: 2,
        },
        labels: {
          fontSize: 12,
          fill: colors.text,
          fontWeight: '600',
          padding: 20,
        },
      },
      colorScale: [
        colors.success,    // Green for protein
        colors.primary,    // Blue for carbs
        colors.warning,    // Amber for fats
        colors.error,      // Red for other
      ],
    },
    scatter: {
      style: {
        data: {
          fill: colors.primary,
          stroke: colors.background,
          strokeWidth: 2,
        },
        labels: {
          fontSize: 11,
          fill: colors.text,
          fontWeight: '500',
        },
      },
    },
    legend: {
      orientation: 'horizontal',
      gutter: 10,
      style: {
        data: {
          type: 'circle',
        },
        labels: {
          fontSize: 12,
          fill: colors.text,
          fontWeight: '500',
        },
        title: {
          fontSize: 14,
          fill: colors.text,
          fontWeight: '600',
        },
      },
    },
    tooltip: {
      style: {
        fontSize: 11,
        fill: colors.text,
        fontWeight: '500',
      },
      flyoutStyle: {
        stroke: colors.border,
        strokeWidth: 1,
        fill: colors.card,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
      },
      cornerRadius: 4,
      pointerLength: 6,
    },
    voronoi: {
      style: {
        data: {
          stroke: 'transparent',
          strokeWidth: 0,
        },
        labels: {
          fontSize: 11,
          fill: colors.text,
          fontWeight: '500',
          padding: 5,
        },
        flyout: {
          stroke: colors.border,
          strokeWidth: 1,
          fill: colors.card,
        },
      },
    },
  }), [colors]);

  return chartTheme;
};

// Chart color schemes for different data types
export const useChartColors = () => {
  const { colors } = useTheme();

  return useMemo(() => ({
    // Macro colors
    macros: {
      protein: colors.success || '#10B981',
      carbs: colors.primary || '#3B82F6',
      fat: colors.warning || '#F59E0B',
      fiber: colors.info || '#8B5CF6',
    },
    // Calorie colors (gradient from low to high)
    calories: {
      low: '#10B981',      // Green
      medium: '#F59E0B',   // Amber
      high: '#EF4444',     // Red
      target: colors.primary || '#3B82F6', // Blue for target line
    },
    // Weight trend colors
    weight: {
      actual: colors.primary || '#3B82F6',
      goal: colors.success || '#10B981',
      trend: colors.info || '#8B5CF6',
    },
    // General chart colors palette
    palette: [
      colors.primary || '#3B82F6',
      colors.success || '#10B981',
      colors.warning || '#F59E0B',
      colors.error || '#EF4444',
      colors.info || '#8B5CF6',
      '#EC4899', // Pink
      '#14B8A6', // Teal
      '#F97316', // Orange
    ],
  }), [colors]);
};

// Common chart animations configuration
export const chartAnimations = {
  onLoad: {
    duration: 800,
    easing: 'quadInOut',
  },
  onEnter: {
    duration: 500,
    before: () => ({ opacity: 0, y: 20 }),
    after: (datum: any) => ({ opacity: 1, y: datum.y }),
  },
  onExit: {
    duration: 500,
    before: () => ({ opacity: 0 }),
  },
};

// Common chart padding and sizing
export const chartDimensions = {
  small: {
    width: 300,
    height: 200,
    padding: { left: 50, bottom: 40, right: 30, top: 20 },
  },
  medium: {
    width: 350,
    height: 250,
    padding: { left: 60, bottom: 50, right: 40, top: 30 },
  },
  large: {
    width: 400,
    height: 300,
    padding: { left: 70, bottom: 60, right: 50, top: 40 },
  },
  responsive: {
    width: '100%',
    height: 250,
    padding: { left: 60, bottom: 50, right: 40, top: 30 },
  },
};

// Format helpers for chart labels
export const chartFormatters = {
  // Format number with k/M suffixes
  abbreviateNumber: (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  },
  
  // Format percentage
  percentage: (value: number, decimals = 0): string => {
    return `${value.toFixed(decimals)}%`;
  },
  
  // Format calories
  calories: (value: number): string => {
    return `${Math.round(value)} cal`;
  },
  
  // Format weight
  weight: (value: number, unit = 'lbs'): string => {
    return `${value.toFixed(1)} ${unit}`;
  },
  
  // Format macros
  macros: (value: number, unit = 'g'): string => {
    return `${Math.round(value)}${unit}`;
  },
  
  // Format date for axis labels
  dateShort: (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  },
  
  // Format date for tooltips
  dateFull: (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  },
};