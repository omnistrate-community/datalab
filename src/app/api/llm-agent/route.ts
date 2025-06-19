import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { 
  DataRow, 
  ProcessingResult, 
  DuplicateAnalysis, 
  MissingValueAnalysis, 
  TextNormalizationAnalysis, 
  OutlierAnalysis, 
  SummaryAnalysis,
  OutlierInfo,
  ColumnSummary
} from '@/types';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  let prompt = '';
  let data: DataRow[] = [];
  let agentType = '';
  
  try {
    const body = await request.json();
    prompt = body.prompt;
    data = body.data;
    agentType = body.agentType;

    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      console.warn('Anthropic API key not configured, falling back to intelligent local processing');
      const response = await processWithLocalLLM(prompt, data, agentType);
      return NextResponse.json({ success: true, result: response });
    }

    // Use real Claude LLM for data processing
    const response = await processWithClaude(prompt, data, agentType);

    return NextResponse.json({ success: true, result: response });
  } catch (error) {
    console.error('LLM API error:', error);
    // Fallback to local processing if Claude fails and we have the data
    if (prompt && data.length > 0 && agentType) {
      try {
        const fallbackResponse = await processWithLocalLLM(prompt, data, agentType);
        return NextResponse.json({ 
          success: true, 
          result: fallbackResponse,
          note: 'Processed with local fallback due to LLM API issue'
        });
      } catch (fallbackError) {
        console.error('Fallback processing also failed:', fallbackError);
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to process with LLM and fallback' },
      { status: 500 }
    );
  }
}

async function processWithClaude(prompt: string, data: DataRow[], agentType: string): Promise<ProcessingResult> {
  // Prepare data for LLM analysis
  const sampleData = data.slice(0, 5); // Send only first 5 rows to avoid token limits
  const dataSchema = Object.keys(data[0] || {});
  
  const systemPrompts = {
    'remove-duplicates': `You are a data cleaning expert. Analyze the provided dataset and identify duplicate records. Return a JSON response with:
    - duplicateRows: array of row indices (0-based) that should be removed
    - reasoning: explanation of your duplicate detection criteria
    - analysis: summary of findings`,
    
    'handle-missing': `You are a data imputation expert. Analyze the dataset and suggest how to handle missing values. Return a JSON response with:
    - strategies: object mapping column names to imputation strategies
    - fillValues: object mapping column names to values to use for filling
    - reasoning: explanation of chosen strategies`,
    
    'normalize-text': `You are a data standardization expert. Analyze text fields and suggest normalization. Return a JSON response with:
    - transformations: array of transformation rules to apply
    - textColumns: array of column names that contain text
    - reasoning: explanation of normalization approach`,
    
    'detect-outliers': `You are a statistical analysis expert. Identify outliers in numeric data. Return a JSON response with:
    - outliers: object mapping column names to arrays of outlier row indices
    - method: statistical method used for detection
    - reasoning: explanation of outlier detection criteria`,
    
    'generate-summary': `You are a data analyst. Generate comprehensive insights about this dataset. Return a JSON response with:
    - insights: array of key findings and patterns
    - dataShape: object with rows, columns, completeness info
    - summary: detailed analysis of each column
    - reasoning: overall assessment of data quality and characteristics`
  };

  const userPrompt = `
Dataset Schema: ${dataSchema.join(', ')}
Total Rows: ${data.length}
Sample Data (first 5 rows):
${JSON.stringify(sampleData, null, 2)}

User Request: ${prompt}

Please analyze this dataset according to the agent type "${agentType}" and provide your recommendations.
  `;

  try {
    const completion = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // Using Haiku for cost efficiency
      max_tokens: 2000,
      temperature: 0.1, // Low temperature for consistent analysis
      system: systemPrompts[agentType as keyof typeof systemPrompts],
      messages: [
        { role: "user", content: userPrompt }
      ],
    });

    const response = completion.content[0];
    if (response.type !== 'text') {
      throw new Error('Invalid response type from Claude');
    }

    // Parse the JSON response
    let llmResult: Record<string, unknown>;
    try {
      llmResult = JSON.parse(response.text);
    } catch {
      // If parsing fails, extract JSON from response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        llmResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from Claude');
      }
    }

    // Apply the LLM recommendations to the actual data
    return applyLLMRecommendations(data, llmResult, agentType);

  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

function applyLLMRecommendations(data: DataRow[], llmResult: Record<string, unknown>, agentType: string): ProcessingResult {
  switch (agentType) {
    case 'remove-duplicates':
      const duplicateIndices = Array.isArray(llmResult.duplicateRows) ? llmResult.duplicateRows as number[] : [];
      const cleanData = data.filter((_, index) => !duplicateIndices.includes(index));
      return {
        processedData: cleanData,
        analysis: {
          originalCount: data.length,
          duplicatesFound: duplicateIndices.length,
          finalCount: cleanData.length,
          duplicateRows: duplicateIndices.map((i: number) => i + 1),
          reasoning: (llmResult.reasoning as string) || 'Claude-based duplicate detection',
          llmAnalysis: llmResult.analysis
        } as DuplicateAnalysis
      };

    case 'handle-missing':
      const strategies = (llmResult.strategies as Record<string, string>) || {};
      const fillValues = (llmResult.fillValues as Record<string, unknown>) || {};
      const processedData = data.map(row => {
        const newRow = { ...row };
        Object.entries(fillValues).forEach(([col, value]) => {
          if (newRow[col] === null || newRow[col] === undefined || newRow[col] === '') {
            newRow[col] = value as string | number | boolean | null | undefined;
          }
        });
        return newRow;
      });
      return {
        processedData,
        analysis: {
          strategies,
          fillValues,
          columnsProcessed: Object.keys(strategies).length,
          reasoning: (llmResult.reasoning as string) || 'Claude-based missing value imputation'
        } as MissingValueAnalysis
      };

    case 'normalize-text':
      const textColumns = Array.isArray(llmResult.textColumns) ? llmResult.textColumns as string[] : [];
      const normalizedData = data.map(row => {
        const newRow = { ...row };
        textColumns.forEach((col: string) => {
          if (typeof newRow[col] === 'string') {
            // Apply basic normalization
            newRow[col] = (newRow[col] as string).trim().replace(/\s+/g, ' ');
          }
        });
        return newRow;
      });
      return {
        processedData: normalizedData,
        analysis: {
          textColumns,
          transformations: Array.isArray(llmResult.transformations) ? llmResult.transformations as string[] : [],
          reasoning: (llmResult.reasoning as string) || 'Claude-based text normalization'
        } as TextNormalizationAnalysis
      };

    case 'detect-outliers':
      const outliers = (llmResult.outliers as Record<string, OutlierInfo[]>) || {};
      return {
        processedData: data,
        analysis: {
          outliers,
          numericColumns: Object.keys(outliers),
          method: (llmResult.method as string) || 'Claude-based detection',
          totalOutliers: Object.values(outliers).reduce((sum: number, arr: OutlierInfo[]) => sum + arr.length, 0),
          reasoning: (llmResult.reasoning as string) || 'Claude-based outlier detection'
        } as OutlierAnalysis
      };

    case 'generate-summary':
      const summary = (llmResult.summary as Record<string, ColumnSummary>) || {};
      const insights = Array.isArray(llmResult.insights) ? llmResult.insights as string[] : [];
      const dataShape = (llmResult.dataShape as { rows: number; columns: number; completeness?: string }) || { 
        rows: data.length, 
        columns: Object.keys(data[0] || {}).length 
      };
      return {
        processedData: data,
        analysis: {
          insights,
          dataShape: {
            ...dataShape,
            completeness: dataShape.completeness || '100%'
          },
          summary,
          reasoning: (llmResult.reasoning as string) || 'Claude-based data analysis'
        } as SummaryAnalysis
      };

    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}

async function processWithLocalLLM(_prompt: string, data: DataRow[], agentType: string): Promise<ProcessingResult> {
  // Local processing fallback functions
  switch (agentType) {
    case 'remove-duplicates':
      return removeDuplicatesLocal(data);
    case 'handle-missing':
      return handleMissingLocal(data);
    case 'normalize-text':
      return normalizeTextLocal(data);
    case 'detect-outliers':
      return detectOutliersLocal(data);
    case 'generate-summary':
      return generateSummaryLocal(data);
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}

function removeDuplicatesLocal(data: DataRow[]): ProcessingResult {
  const duplicates: number[] = [];
  const seen = new Map();
  
  data.forEach((row, index) => {
    const key = Object.values(row).map(val => String(val || '').toLowerCase().trim()).join('|');
    if (seen.has(key)) {
      duplicates.push(index);
    } else {
      seen.set(key, index);
    }
  });
  
  const cleanData = data.filter((_, index) => !duplicates.includes(index));
  
  return {
    processedData: cleanData,
    analysis: {
      originalCount: data.length,
      duplicatesFound: duplicates.length,
      finalCount: cleanData.length,
      duplicateRows: duplicates.map(i => i + 1),
      reasoning: `Identified ${duplicates.length} duplicate rows based on exact field matching.`
    } as DuplicateAnalysis
  };
}

function handleMissingLocal(data: DataRow[]): ProcessingResult {
  const columns = Object.keys(data[0] || {});
  const strategies: Record<string, string> = {};
  const fillValues: Record<string, unknown> = {};
  
  columns.forEach(col => {
    const values = data.map(row => row[col]).filter(val => val !== null && val !== undefined && val !== '');
    const missingCount = data.length - values.length;
    
    if (missingCount === 0) return;
    
    if (values.length === 0) {
      strategies[col] = 'default';
      fillValues[col] = 'Unknown';
    } else if (values.every(val => !isNaN(Number(val)))) {
      const numbers = values.map(Number).sort((a, b) => a - b);
      const median = numbers[Math.floor(numbers.length / 2)];
      strategies[col] = 'median';
      fillValues[col] = median;
    } else {
      const freq: Record<string, number> = {};
      values.forEach(val => {
        const key = String(val);
        freq[key] = (freq[key] || 0) + 1;
      });
      const mostFrequent = Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
      strategies[col] = 'mode';
      fillValues[col] = mostFrequent;
    }
  });
  
  const processedData = data.map(row => {
    const newRow = { ...row };
    columns.forEach(col => {
      if (newRow[col] === null || newRow[col] === undefined || newRow[col] === '') {
        newRow[col] = fillValues[col] as string | number | boolean | null | undefined;
      }
    });
    return newRow;
  });
  
  return {
    processedData,
    analysis: {
      strategies,
      fillValues,
      columnsProcessed: Object.keys(strategies).length,
      reasoning: 'Applied statistical imputation strategies for missing values.'
    } as MissingValueAnalysis
  };
}

function normalizeTextLocal(data: DataRow[]): ProcessingResult {
  const textColumns = Object.keys(data[0] || {}).filter(col => 
    data.some(row => typeof row[col] === 'string')
  );
  
  const processedData = data.map(row => {
    const newRow = { ...row };
    textColumns.forEach(col => {
      if (typeof newRow[col] === 'string') {
        let normalized = (newRow[col] as string).trim().replace(/\s+/g, ' ').toLowerCase();
        if (col.toLowerCase().includes('name') || col.toLowerCase().includes('title')) {
          normalized = normalized.replace(/\b\w/g, l => l.toUpperCase());
        }
        newRow[col] = normalized;
      }
    });
    return newRow;
  });
  
  return {
    processedData,
    analysis: {
      textColumns,
      transformations: ['Trimmed whitespace', 'Normalized spaces', 'Applied capitalization'],
      reasoning: `Normalized text in ${textColumns.length} columns using standard formatting rules.`
    } as TextNormalizationAnalysis
  };
}

function detectOutliersLocal(data: DataRow[]): ProcessingResult {
  const numericColumns = Object.keys(data[0] || {}).filter(col =>
    data.some(row => !isNaN(Number(row[col])) && row[col] !== null && row[col] !== '')
  );
  
  const outliers: Record<string, OutlierInfo[]> = {};
  
  numericColumns.forEach(col => {
    const values = data.map(row => Number(row[col])).filter(val => !isNaN(val)).sort((a, b) => a - b);
    if (values.length < 4) return;
    
    const q1Index = Math.floor(values.length * 0.25);
    const q3Index = Math.floor(values.length * 0.75);
    const q1 = values[q1Index];
    const q3 = values[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const columnOutliers = data
      .map((row, index) => ({ row, index, value: Number(row[col]) }))
      .filter(({ value }) => !isNaN(value) && (value < lowerBound || value > upperBound))
      .map(({ row, index, value }) => ({ 
        rowIndex: index + 1, 
        value, 
        row: Object.keys(row).reduce((acc, key) => {
          acc[key] = key === col ? value : row[key];
          return acc;
        }, {} as DataRow)
      }));
    
    if (columnOutliers.length > 0) {
      outliers[col] = columnOutliers;
    }
  });
  
  return {
    processedData: data,
    analysis: {
      numericColumns,
      outliers,
      totalOutliers: Object.values(outliers).reduce((sum, arr) => sum + arr.length, 0),
      method: 'IQR (Interquartile Range)',
      reasoning: `Used IQR method to detect outliers in ${numericColumns.length} numeric columns.`
    } as OutlierAnalysis
  };
}

function generateSummaryLocal(data: DataRow[]): ProcessingResult {
  const columns = Object.keys(data[0] || {});
  const summary: Record<string, ColumnSummary> = {};
  
  columns.forEach(col => {
    const values = data.map(row => row[col]).filter(val => val !== null && val !== undefined && val !== '');
    const totalValues = values.length;
    const missingValues = data.length - totalValues;
    
    if (values.every(val => !isNaN(Number(val)))) {
      const numbers = values.map(Number);
      const sorted = [...numbers].sort((a, b) => a - b);
      
      summary[col] = {
        type: 'numeric',
        count: totalValues,
        missing: missingValues,
        min: Math.min(...numbers),
        max: Math.max(...numbers),
        mean: numbers.reduce((sum, val) => sum + val, 0) / numbers.length,
        median: sorted[Math.floor(sorted.length / 2)],
        uniqueValues: new Set(numbers).size
      };
    } else {
      const freq: Record<string, number> = {};
      values.forEach(val => {
        const key = String(val);
        freq[key] = (freq[key] || 0) + 1;
      });
      
      const topValues = Object.entries(freq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([value, count]) => ({ value, count, percentage: (count / totalValues * 100).toFixed(1) }));
      
      summary[col] = {
        type: 'categorical',
        count: totalValues,
        missing: missingValues,
        uniqueValues: Object.keys(freq).length,
        topValues
      };
    }
  });
  
  const insights = [];
  const totalCells = data.length * columns.length;
  const missingCells = Object.values(summary).reduce((sum: number, col: ColumnSummary) => sum + col.missing, 0);
  const completeness = ((totalCells - missingCells) / totalCells * 100).toFixed(1);
  insights.push(`Dataset is ${completeness}% complete with ${missingCells} missing values`);
  
  const numericCols = Object.entries(summary).filter(([, info]) => info.type === 'numeric');
  if (numericCols.length > 0) {
    insights.push(`Found ${numericCols.length} numeric columns suitable for statistical analysis`);
  }
  
  const categoricalCols = Object.entries(summary).filter(([, info]) => info.type === 'categorical');
  if (categoricalCols.length > 0) {
    insights.push(`Found ${categoricalCols.length} categorical columns suitable for grouping and classification`);
  }
  
  return {
    processedData: data,
    analysis: {
      summary,
      insights,
      dataShape: {
        rows: data.length,
        columns: columns.length,
        completeness: `${completeness}%`
      },
      reasoning: `Generated comprehensive statistical summary for all ${columns.length} columns.`
    } as SummaryAnalysis
  };
}
