export type WidgetType =
  | 'text'
  | 'lineChart'
  | 'barChart'
  | 'table'
  | 'redirectButton';

export interface BaseWidgetData {
  id: string;
  type: WidgetType;
  title: string;
}

export interface TextWidgetData extends BaseWidgetData {
  type: 'text';
  content: string;
}

export interface ChartWidgetData extends BaseWidgetData {
  type: 'lineChart' | 'barChart';
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor?: string;
    }>;
  };
}

export interface TableWidgetData extends BaseWidgetData {
  type: 'table';
  columns: string[];
  rows: string[][];
}

export interface RedirectButtonWidgetData extends BaseWidgetData {
  type: 'redirectButton';
  buttonText: string;
  redirectUrl: string;

  // --- INFO API (e.g. to start an action, send data, etc.) ---
  infoApiEndpoint?: string;
  infoApiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  infoApiData?: any;

  // --- STATUS API (e.g. to check progress / status) ---
  statusApiEndpoint?: string;
  statusApiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

export type Widget =
  | TextWidgetData
  | ChartWidgetData
  | TableWidgetData
  | RedirectButtonWidgetData;
