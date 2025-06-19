export interface DataRow {
  [key: string]: string | number | boolean | null | undefined;
}

export interface DatasetInfo {
  totalRows: number;
  totalColumns: number;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  nullCount: number;
  uniqueCount: number;
  sampleValues: Array<string | number | boolean | null>;
}

export interface AgentResult {
  success: boolean;
  message: string;
  data?: DataRow[];
  metadata?: Record<string, unknown>;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: 'cleaning' | 'transformation' | 'analysis';
  parameters?: AgentParameter[];
}

export interface AgentParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required: boolean;
  description: string;
  options?: string[];
  defaultValue?: string | number | boolean;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'histogram';

export interface ChartConfig {
  type: ChartType;
  xAxis: string;
  yAxis?: string;
  groupBy?: string;
  aggregation?: 'sum' | 'average' | 'count' | 'min' | 'max';
}

export interface LLMRequest {
  prompt: string;
  data: DataRow[];
  agentType: string;
}

export interface LLMResponse {
  success: boolean;
  result: ProcessingResult;
  note?: string;
}

export interface ProcessingResult {
  processedData: DataRow[];
  analysis: ProcessingAnalysis;
}

export interface ProcessingAnalysis {
  reasoning: string;
  [key: string]: unknown;
}

export interface DuplicateAnalysis extends ProcessingAnalysis {
  originalCount: number;
  duplicatesFound: number;
  finalCount: number;
  duplicateRows: number[];
}

export interface MissingValueAnalysis extends ProcessingAnalysis {
  strategies: Record<string, string>;
  fillValues: Record<string, unknown>;
  columnsProcessed: number;
}

export interface TextNormalizationAnalysis extends ProcessingAnalysis {
  textColumns: string[];
  transformations: string[];
}

export interface OutlierAnalysis extends ProcessingAnalysis {
  numericColumns: string[];
  outliers: Record<string, OutlierInfo[]>;
  totalOutliers: number;
  method: string;
}

export interface OutlierInfo {
  rowIndex: number;
  value: number;
  row: DataRow;
}

export interface SummaryAnalysis extends ProcessingAnalysis {
  summary: Record<string, ColumnSummary>;
  insights: string[];
  dataShape: {
    rows: number;
    columns: number;
    completeness: string;
  };
}

export interface ColumnSummary {
  type: 'numeric' | 'categorical';
  count: number;
  missing: number;
  uniqueValues: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  topValues?: Array<{
    value: string;
    count: number;
    percentage: string;
  }>;
}
