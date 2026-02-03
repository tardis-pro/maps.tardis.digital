/**
 * Generative Dashboard Layouts
 * Auto-configures dashboard widgets based on data types.
 */

interface WidgetConfig {
  type: string;
  grid: { x: number; y: number; w: number; h: number };
}

export class LayoutGenerator {
  private static WIDGET_MAPPING: Record<string, string[]> = {
    temporal: ['timeline', 'time-series'],
    monetary: ['kpi-card', 'bar-chart', 'pie-chart'],
    spatial: ['map-view', 'choropleth'],
    categorical: ['bar-chart', 'pie-chart', 'table'],
    numeric: ['histogram', 'scatter-plot', 'stats-card'],
  };

  generate(dataTypes: string[]): WidgetConfig[] {
    const widgets: WidgetConfig[] = [];

    for (const dtype of dataTypes) {
      const lower = dtype.toLowerCase();
      
      if (lower.includes('date') || lower.includes('time') || lower.includes('temporal')) {
        widgets.push({ type: 'timeline', grid: { x: 0, y: widgets.length, w: 12, h: 4 } });
      } else if (lower.includes('price') || lower.includes('money') || lower.includes('currency')) {
        widgets.push({ type: 'kpi-card', grid: { x: 0, y: widgets.length, w: 3, h: 2 } });
      } else if (lower.includes('lat') || lower.includes('lon') || lower.includes('location')) {
        widgets.push({ type: 'map-view', grid: { x: 0, y: widgets.length, w: 8, h: 6 } });
      } else if (lower.includes('category') || lower.includes('type')) {
        widgets.push({ type: 'bar-chart', grid: { x: 0, y: widgets.length, w: 6, h: 4 } });
      } else {
        widgets.push({ type: 'stats-card', grid: { x: 0, y: widgets.length, w: 3, h: 2 } });
      }
    }

    return widgets;
  }
}

export default LayoutGenerator;
