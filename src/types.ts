export interface DataRow {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ProcessingResult {
  processedData: DataRow[];
  analysis: Record<string, unknown>;
  message?: string;
}

export interface DuplicateAnalysis {
  originalCount: number;
  duplicatesFound: number;
  finalCount: number;
  duplicateRows: number[];
  reasoning: string;
  llmAnalysis?: unknown;
}

export interface MissingValueAnalysis {
  missingValues: Record<string, number>;
  strategies: Record<string, string>;
  fillValues: Record<string, unknown>;
  reasoning: string;
  insights: string[];
}

export interface TextNormalizationAnalysis {
  transformations: string[];
  textColumns: string[];
  reasoning: string;
  insights: string[];
}

export interface OutlierAnalysis {
  outliers: Record<string, OutlierInfo[]>;
  method: string;
  reasoning: string;
  statistics: Record<string, unknown>;
}

export interface OutlierInfo {
  rowIndex: number;
  value: number;
  zScore?: number;
  reason?: string;
}

export interface SummaryAnalysis {
  summary: Record<string, ColumnSummary>;
  insights: string[];
  dataShape: {
    rows: number;
    columns: number;
    completeness: string;
  };
  reasoning: string;
}

export interface ColumnSummary {
  type: 'numeric' | 'categorical' | 'date' | 'text';
  missing: number;
  unique: number;
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  mostCommon?: string | number;
  samples?: (string | number)[];
}
