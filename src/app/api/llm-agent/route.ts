import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { 
  DataRow, 
  ProcessingResult, 
  OutlierInfo
} from '@/types';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  let prompt = '';
  let data: DataRow[] = [];
  let agentType = '';
  let userMessage = '';
  
  try {
    const body = await request.json();
    prompt = body.prompt;
    data = body.data;
    agentType = body.agentType;
    userMessage = body.userMessage || '';

    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      console.warn('Anthropic API key not configured, falling back to intelligent local processing');
      const response = await processWithLocalLLM(prompt, data, agentType, userMessage);
      return NextResponse.json({ success: true, result: response });
    }

    // Use real Claude LLM for data processing
    const response = await processWithClaude(prompt, data, agentType, userMessage);

    return NextResponse.json({ success: true, result: response });
  } catch (error) {
    console.error('LLM API error:', error);
    // Fallback to local processing if Claude fails and we have the data
    if (prompt && data.length > 0 && agentType) {
      try {
        const fallbackResponse = await processWithLocalLLM(prompt, data, agentType, userMessage);
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

async function processWithClaude(prompt: string, data: DataRow[], agentType: string, userMessage?: string): Promise<ProcessingResult> {
  // Prepare data for LLM analysis
  const sampleData = data.slice(0, 5); // Send only first 5 rows to avoid token limits
  const dataSchema = Object.keys(data[0] || {});
  
  const systemPrompts = {
    'remove-duplicates': `You are a data cleaning expert specializing in duplicate detection. When a user asks you questions about their data, engage in a helpful conversation and answer their specific questions. You can also analyze their dataset to identify duplicate records.

When analyzing data, provide insights about:
- Duplicate detection criteria and methods
- Number and types of duplicates found
- Recommendations for handling duplicates
- Impact on data quality

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,
    
    'handle-missing': `You are a data imputation expert. Engage conversationally with users about their missing data concerns. Answer their specific questions about missing values, data completeness, and imputation strategies.

When analyzing data, provide insights about:
- Missing value patterns and causes
- Recommended imputation strategies for each column
- Impact of different imputation methods
- Data quality implications

Always prioritize answering the user's direct questions in a helpful, conversational manner. **Use Markdown formatting** including headers, bullet points, tables, and code blocks to make your responses clear and well-structured.`,
    
    'normalize-text': `You are a data standardization expert. Help users understand and improve their text data quality. Answer their specific questions about text formatting, standardization, and cleaning.

When analyzing data, provide insights about:
- Text quality issues and inconsistencies
- Standardization opportunities
- Encoding and formatting problems
- Recommended normalization approaches

Respond conversationally to user questions and provide actionable advice. **Use Markdown formatting** with headers, lists, code examples, and emphasis to make your guidance clear and actionable.`,
    
    'detect-outliers': `You are a statistical analysis expert specializing in outlier detection. Engage with users about their data anomalies and statistical concerns. Answer their specific questions about outliers, data distribution, and statistical patterns.

When analyzing data, provide insights about:
- Outlier detection methods and results
- Statistical significance of anomalies
- Potential causes of outliers
- Recommendations for handling outliers

Always respond to user questions directly and provide context for your analysis. **Format responses using Markdown** with proper headers, tables for statistics, code blocks for formulas, and emphasis for key points.`,
    
    'generate-summary': `You are a data analyst who helps users understand their datasets. Engage conversationally and answer specific questions about data characteristics, patterns, and quality.

When analyzing data, provide insights about:
- Dataset overview and key characteristics
- Data quality assessment
- Notable patterns and distributions
- Recommendations for further analysis

Focus on answering user questions clearly and providing helpful context about their data. **Use Markdown formatting** including headers, tables, lists, and code blocks to present your analysis in a structured, readable format.`,

    'data-validator': `You are a data quality expert. Help users understand data validation issues and quality problems. Answer their specific questions about data types, formats, and validation errors.

When analyzing data, provide insights about:
- Data type inconsistencies
- Format validation issues
- Business rule violations
- Data quality recommendations

Engage conversationally and provide actionable advice for data quality improvements. **Use Markdown formatting** with headers, lists, tables, and code examples to clearly present validation results and recommendations.`,

    'column-transformer': `You are a data transformation expert. Help users transform and reshape their data. Answer their specific questions about column operations, data reshaping, and feature engineering.

When analyzing data, provide insights about:
- Column transformation opportunities
- Data type conversions
- Feature derivation possibilities
- Data restructuring recommendations

Respond conversationally to user needs and provide practical transformation advice. **Format your responses with Markdown** using headers, code blocks for transformation examples, lists for recommendations, and tables for comparisons.`,

    'data-aggregator': `You are a data aggregation expert. Help users summarize and group their data effectively. Answer their specific questions about aggregation methods, grouping strategies, and summary statistics.

When analyzing data, provide insights about:
- Optimal grouping columns
- Appropriate aggregation functions
- Summary statistics and trends
- Data aggregation best practices

Engage conversationally and provide tailored aggregation recommendations. **Use Markdown formatting** with headers, tables for results, code blocks for examples, and lists for recommendations.`,

    'correlation-analyzer': `You are a correlation analysis expert. Help users discover relationships in their data. Answer their specific questions about correlations, relationships, and statistical dependencies.

When analyzing data, provide insights about:
- Correlation coefficients and significance
- Strong and weak relationships
- Causal vs correlational relationships
- Statistical interpretation

Respond conversationally and explain correlations in understandable terms. **Use Markdown formatting** with headers, tables for correlation matrices, code blocks for statistical formulas, and emphasis for key findings.`,

    'trend-analyzer': `You are a time-series and trend analysis expert. Help users understand patterns and trends in their data. Answer their specific questions about temporal patterns, seasonality, and forecasting.

When analyzing data, provide insights about:
- Trend identification and analysis
- Seasonal patterns and cycles
- Data evolution over time
- Forecasting opportunities

Engage conversationally and provide clear explanations of temporal patterns. **Format responses using Markdown** with headers, tables for trend data, lists for observations, and code blocks for time series examples.`,

    'pattern-finder': `You are a pattern recognition expert using ML techniques. Help users discover hidden patterns and structures in their data. Answer their specific questions about clustering, classification, and pattern discovery.

When analyzing data, provide insights about:
- Hidden patterns and clusters
- Data groupings and segments
- Anomalous patterns
- Machine learning opportunities

Respond conversationally and explain patterns in accessible language. **Use Markdown formatting** including headers, lists for pattern descriptions, tables for cluster summaries, and code blocks for ML examples.`,

    'chart-recommender': `You are a data visualization expert. Help users choose the best ways to visualize their data. Answer their specific questions about chart types, visualization best practices, and data presentation.

When analyzing data, provide insights about:
- Optimal chart types for different data
- Visualization best practices
- Data storytelling opportunities
- Interactive visualization suggestions

Engage conversationally and provide practical visualization advice. **Format responses with Markdown** using headers, tables for chart recommendations, lists for best practices, and code blocks for visualization examples.`,

    'report-generator': `You are a report generation expert. Help users create comprehensive data reports and summaries. Answer their specific questions about report structure, key findings, and data presentation.

When analyzing data, provide insights about:
- Report structure and organization
- Key findings and takeaways
- Data storytelling elements
- Professional presentation tips

Respond conversationally and provide clear guidance for effective reporting. **Use Markdown formatting extensively** with headers, tables, lists, blockquotes for key insights, and code blocks for examples to create well-structured report content.`
  };

  const userPrompt = `
Dataset Information:
- Schema: ${dataSchema.join(', ')}
- Total Rows: ${data.length}
- Sample Data (first 5 rows):
${JSON.stringify(sampleData, null, 2)}

${userMessage ? `
User Question: "${userMessage}"

Please answer the user's specific question directly and conversationally. After addressing their question, you can provide additional relevant insights about their data if helpful.` : `
Task: ${prompt}

Please analyze this dataset and provide helpful insights as a ${agentType.replace(/-/g, ' ')} specialist.`}

Important: 
1. Answer the user's question directly first
2. Be conversational and helpful
3. Provide specific insights based on their actual data
4. **Format your entire response using Markdown** for better readability:
   - Use headers (##, ###) to organize sections
   - Use bullet points and numbered lists for clarity
   - Use **bold** and *italic* text for emphasis
   - Use \`code blocks\` for data examples, formulas, or technical terms
   - Use tables for structured data presentation
   - Use > blockquotes for key insights or recommendations
5. If you provide additional analysis, format it as JSON only when returning structured data for processing
6. Focus on being helpful and answering what they actually asked
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

    const responseText = response.text;
    
    // For conversational responses, we'll create a structured analysis object
    // but keep the main response as the conversational text
    const analysis = {
      reasoning: responseText,
      insights: extractInsights(responseText),
      agentType,
      conversational: true
    };

    // Try to extract any structured data from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const structuredData = JSON.parse(jsonMatch[0]);
        Object.assign(analysis, structuredData);
      } catch {
        // If JSON parsing fails, continue with conversational response
      }
    }

    return {
      analysis,
      processedData: data // Keep original data unless specific processing is requested
    };

  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

// Helper function to extract insights from conversational text
function extractInsights(text: string): string[] {
  const insights: string[] = [];
  
  // Look for bullet points, numbered lists, or key findings
  const bulletRegex = /[•\-\*]\s*([^\n]+)/g;
  const numberedRegex = /\d+\.\s*([^\n]+)/g;
  const keyFindingsRegex = /(?:key findings?|insights?|important points?)[:\s]*([^\n]+)/gi;
  
  let match;
  
  // Extract bullet points
  while ((match = bulletRegex.exec(text)) !== null) {
    insights.push(match[1].trim());
  }
  
  // Extract numbered points
  while ((match = numberedRegex.exec(text)) !== null) {
    insights.push(match[1].trim());
  }
  
  // Extract key findings
  while ((match = keyFindingsRegex.exec(text)) !== null) {
    insights.push(match[1].trim());
  }
  
  // If no structured insights found, split into sentences and take meaningful ones
  if (insights.length === 0) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    insights.push(...sentences.slice(0, 3).map(s => s.trim()));
  }
  
  return insights.slice(0, 5); // Limit to 5 insights
}



// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function processWithLocalLLM(_prompt: string, data: DataRow[], agentType: string, _userMessage?: string): Promise<ProcessingResult> {
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
    case 'data-validator':
      return validateDataLocal(data);
    case 'correlation-analyzer':
      return analyzeCorrelationsLocal(data);
    case 'trend-analyzer':
      return analyzeTrendsLocal(data);
    default:
      // For new agent types without specific local implementation,
      // return a generic response
      return {
        analysis: {
          reasoning: `This is a ${agentType.replace(/-/g, ' ')} agent. Local processing is limited, but I can provide basic insights about your ${data.length} row dataset with columns: ${Object.keys(data[0] || {}).join(', ')}.`,
          insights: [
            `Dataset contains ${data.length} rows`,
            `Available columns: ${Object.keys(data[0] || {}).join(', ')}`,
            "For advanced analysis, configure an LLM API key in your settings"
          ],
          agentType,
          localFallback: true
        },
        processedData: data
      };
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
    }
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
      reasoning: 'Applied statistical imputation strategies for missing values.',
      missingValues: {},
      insights: [`Processed ${Object.keys(strategies).length} columns with missing values`]
    }
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
      reasoning: `Normalized text in ${textColumns.length} columns using standard formatting rules.`,
      insights: [`Processed ${textColumns.length} text columns`]
    }
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
      reasoning: `Used IQR method to detect outliers in ${numericColumns.length} numeric columns.`,
      statistics: {}
    }
  };
}

function generateSummaryLocal(data: DataRow[]): ProcessingResult {
  const columns = Object.keys(data[0] || {});
  const summary: Record<string, Record<string, unknown>> = {};
  
  columns.forEach(col => {
    const values = data.map(row => row[col]).filter(val => val !== null && val !== undefined && val !== '');
    const totalValues = values.length;
    const missingValues = data.length - totalValues;
    
    if (values.every(val => !isNaN(Number(val)))) {
      const numbers = values.map(Number);
      const sorted = [...numbers].sort((a, b) => a - b);
      
      summary[col] = {
        type: 'numeric',
        missing: missingValues,
        unique: new Set(numbers).size,
        min: Math.min(...numbers),
        max: Math.max(...numbers),
        mean: numbers.reduce((sum, val) => sum + val, 0) / numbers.length,
        median: sorted[Math.floor(sorted.length / 2)]
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
        missing: missingValues,
        unique: Object.keys(freq).length,
        mostCommon: topValues[0]?.value || '',
        samples: topValues.map(tv => tv.value)
      };
    }
  });
  
  const insights = [];
  const totalCells = data.length * columns.length;
  const missingCells = Object.values(summary).reduce((sum: number, col: Record<string, unknown>) => sum + (col.missing as number || 0), 0);
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
    }
  };
}

function validateDataLocal(data: DataRow[]): ProcessingResult {
  if (!data.length) {
    return {
      processedData: data,
      analysis: {
        reasoning: "No data to validate",
        insights: ["Dataset is empty"],
        validationErrors: [],
        dataTypes: {}
      }
    };
  }

  const columns = Object.keys(data[0]);
  const validationErrors: string[] = [];
  const dataTypes: Record<string, string> = {};

  columns.forEach(col => {
    const values = data.map(row => row[col]).filter(val => val != null && val !== '');
    
    if (values.length === 0) {
      dataTypes[col] = 'empty';
      validationErrors.push(`Column '${col}' contains only null/empty values`);
      return;
    }

    // Detect data type
    const numericValues = values.filter(val => !isNaN(parseFloat(String(val))) && isFinite(Number(val)));
    const dateValues = values.filter(val => !isNaN(Date.parse(String(val))));
    
    if (numericValues.length === values.length) {
      dataTypes[col] = 'numeric';
    } else if (dateValues.length > values.length * 0.8) {
      dataTypes[col] = 'date';
    } else {
      dataTypes[col] = 'text';
    }

    // Check for inconsistent data types
    if (numericValues.length > 0 && numericValues.length < values.length * 0.9) {
      validationErrors.push(`Column '${col}' has mixed data types (${numericValues.length}/${values.length} numeric)`);
    }
  });

  const insights = [
    `Validated ${columns.length} columns`,
    `Found ${validationErrors.length} validation issues`,
    `Data types detected: ${Object.entries(dataTypes).map(([col, type]) => `${col}(${type})`).join(', ')}`
  ];

  return {
    processedData: data,
    analysis: {
      reasoning: `Performed data validation on ${data.length} rows and ${columns.length} columns`,
      insights,
      validationErrors,
      dataTypes
    }
  };
}

function analyzeCorrelationsLocal(data: DataRow[]): ProcessingResult {
  if (!data.length) {
    return {
      processedData: data,
      analysis: {
        reasoning: "No data to analyze correlations",
        insights: ["Dataset is empty"],
        correlations: {},
        strongRelationships: []
      }
    };
  }

  const columns = Object.keys(data[0]);
  const numericColumns = columns.filter(col => {
    const values = data.map(row => row[col]).filter(val => val != null && val !== '');
    return values.every(val => !isNaN(parseFloat(String(val))) && isFinite(Number(val)));
  });

  const correlations: Record<string, number> = {};
  const strongRelationships: string[] = [];

  // Calculate simple correlations for numeric columns
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];
      
      const values1 = data.map(row => parseFloat(String(row[col1]))).filter(val => !isNaN(val));
      const values2 = data.map(row => parseFloat(String(row[col2]))).filter(val => !isNaN(val));
      
      if (values1.length > 1 && values2.length > 1) {
        // Simple correlation calculation
        const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length;
        const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length;
        
        const numerator = values1.reduce((sum, val, idx) => sum + (val - mean1) * (values2[idx] - mean2), 0);
        const denominator1 = Math.sqrt(values1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0));
        const denominator2 = Math.sqrt(values2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0));
        
        if (denominator1 > 0 && denominator2 > 0) {
          const correlation = numerator / (denominator1 * denominator2);
          correlations[`${col1}-${col2}`] = Math.round(correlation * 1000) / 1000;
          
          if (Math.abs(correlation) > 0.7) {
            strongRelationships.push(`${col1} and ${col2} (${correlation.toFixed(3)})`);
          }
        }
      }
    }
  }

  const insights = [
    `Analyzed correlations between ${numericColumns.length} numeric columns`,
    `Found ${Object.keys(correlations).length} correlation pairs`,
    `Identified ${strongRelationships.length} strong relationships (|r| > 0.7)`
  ];

  return {
    processedData: data,
    analysis: {
      reasoning: `Calculated correlations between numeric columns using Pearson correlation coefficient`,
      insights,
      correlations,
      strongRelationships
    }
  };
}

function analyzeTrendsLocal(data: DataRow[]): ProcessingResult {
  if (!data.length) {
    return {
      processedData: data,
      analysis: {
        reasoning: "No data to analyze trends",
        insights: ["Dataset is empty"],
        trends: [],
        patterns: {}
      }
    };
  }

  const columns = Object.keys(data[0]);
  const dateColumns = columns.filter(col => {
    const values = data.map(row => row[col]).filter(val => val != null && val !== '');
    return values.some(val => !isNaN(Date.parse(String(val))));
  });

  const numericColumns = columns.filter(col => {
    const values = data.map(row => row[col]).filter(val => val != null && val !== '');
    return values.every(val => !isNaN(parseFloat(String(val))) && isFinite(Number(val)));
  });

  const trends: string[] = [];
  const patterns: Record<string, unknown> = {};

  if (dateColumns.length === 0) {
    // No date columns, try to find trends in sequential data
    numericColumns.forEach(col => {
      const values = data.map(row => parseFloat(String(row[col]))).filter(val => !isNaN(val));
      if (values.length > 2) {
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        
        const change = ((secondAvg - firstAvg) / firstAvg * 100);
        if (Math.abs(change) > 10) {
          trends.push(`${col} shows ${change > 0 ? 'increasing' : 'decreasing'} trend (${change.toFixed(1)}% change)`);
        }
      }
    });
  }

  // Basic seasonality detection (if we have enough data points)
  if (data.length >= 12) {
    patterns.dataPoints = data.length;
    patterns.potentialSeasonality = "Dataset has enough points for seasonal analysis";
  }

  const insights = [
    `Analyzed ${numericColumns.length} numeric columns for trends`,
    `Found ${dateColumns.length} date columns`,
    `Identified ${trends.length} potential trends`,
    data.length >= 12 ? "Dataset suitable for seasonal analysis" : "Dataset too small for reliable trend analysis"
  ];

  return {
    processedData: data,
    analysis: {
      reasoning: `Performed basic trend analysis on ${data.length} data points`,
      insights,
      trends,
      patterns
    }
  };
}
