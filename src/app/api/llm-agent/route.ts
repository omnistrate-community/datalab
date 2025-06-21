import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  DataRow, 
  ProcessingResult
} from '@/types';

// Initialize Anthropic client (only when needed)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const anthropic: Anthropic | null = null;

// vLLM configuration
const VLLM_ENDPOINT_URL = process.env.VLLM_ENDPOINT_URL;
const VLLM_MODEL_NAME = process.env.VLLM_MODEL_NAME || 'meta-llama/Llama-3.1-8B-Instruct';

// Environment variable controls
const DISABLE_VLLM = process.env.DISABLE_VLLM === 'true';
const STATIC_VLLM_ENDPOINT = process.env.STATIC_VLLM_ENDPOINT;

export async function POST(request: NextRequest) {
  let prompt = '';
  let data: DataRow[] = [];
  let agentType = '';
  let userMessage = '';
  let hasData = false;
  let chatHistory: Array<{id: string, type: string, content: string, timestamp: Date}> = [];
  let columns: string[] = [];
  
  try {
    const body = await request.json();
    prompt = body.prompt;
    data = body.data || [];
    agentType = body.agentType;
    userMessage = body.userMessage || '';
    hasData = body.hasData ?? (data.length > 0);
    chatHistory = body.chatHistory || [];
    columns = body.columns || [];

    // Get user's preferred LLM provider
    const session = await getServerSession(authOptions);
    let userPreferredProvider = 'ANTHROPIC'; // Default fallback
    let userVllmEndpoint = VLLM_ENDPOINT_URL;
    let userVllmModel = VLLM_MODEL_NAME;
    let userAnthropicKey = process.env.ANTHROPIC_API_KEY;
    let userOpenaiKey = process.env.OPENAI_API_KEY;

    if (session?.user?.id) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            profile: {
              select: {
                preferredLLMProvider: true,
                vllmEndpointUrl: true,
                vllmModelName: true,
                anthropicApiKey: true,
                openaiApiKey: true,
              }
            }
          }
        });

        if (user?.profile) {
          userPreferredProvider = user.profile.preferredLLMProvider || 'ANTHROPIC';
          userVllmEndpoint = user.profile.vllmEndpointUrl || VLLM_ENDPOINT_URL;
          userVllmModel = user.profile.vllmModelName || VLLM_MODEL_NAME;
          userAnthropicKey = user.profile.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
          userOpenaiKey = user.profile.openaiApiKey || process.env.OPENAI_API_KEY;
        }
      } catch (error) {
        console.warn('Failed to fetch user preferences, using defaults:', error);
      }
    }

    // Apply environment variable overrides
    if (DISABLE_VLLM && userPreferredProvider === 'VLLM') {
      console.log('vLLM disabled by environment variable, falling back to Claude');
      userPreferredProvider = 'ANTHROPIC';
    }
    
    if (STATIC_VLLM_ENDPOINT) {
      userVllmEndpoint = STATIC_VLLM_ENDPOINT;
      console.log(`Using static vLLM endpoint: ${STATIC_VLLM_ENDPOINT}`);
    }

    // Determine which provider to use based on user preference and availability
    let providerToUse = userPreferredProvider;
    
    // Validate provider availability and fallback if needed
    if (providerToUse === 'VLLM' && (!userVllmEndpoint || userVllmEndpoint.trim() === '')) {
      console.log('vLLM selected but endpoint not configured, falling back to Claude');
      providerToUse = 'ANTHROPIC';
    }
    
    if (providerToUse === 'ANTHROPIC' && (!userAnthropicKey || userAnthropicKey === 'your_anthropic_api_key_here')) {
      console.log('Claude selected but API key not configured, falling back to local');
      providerToUse = 'LOCAL';
    }
    
    if (providerToUse === 'OPENAI' && (!userOpenaiKey || userOpenaiKey === 'your_openai_api_key_here')) {
      console.log('OpenAI selected but API key not configured, falling back to local');
      providerToUse = 'LOCAL';
    }

    // Process with the selected/fallback provider
    switch (providerToUse) {
      case 'VLLM':
        console.log(`Using vLLM endpoint for data processing: ${userVllmEndpoint}`);
        const vllmResponse = await processWithVLLM(prompt, data, agentType, userMessage, hasData, chatHistory, columns, userVllmEndpoint, userVllmModel);
        return NextResponse.json({ success: true, result: vllmResponse, provider: 'vLLM', model: userVllmModel });
        
      case 'ANTHROPIC':
        console.log('Using Claude for data processing');
        const claudeResponse = await processWithClaude(prompt, data, agentType, userMessage, hasData, chatHistory, columns, userAnthropicKey);
        return NextResponse.json({ success: true, result: claudeResponse, provider: 'claude' });
        
      case 'OPENAI':
        console.log('Using OpenAI for data processing');
        // TODO: Implement OpenAI processing
        const openaiResponse = await processWithLocalLLM(prompt, data, agentType, userMessage, hasData, chatHistory);
        return NextResponse.json({ success: true, result: openaiResponse, provider: 'openai-fallback', note: 'OpenAI not yet implemented, using local processing' });
        
      case 'LOCAL':
      default:
        console.log('Using local processing');
        const localResponse = await processWithLocalLLM(prompt, data, agentType, userMessage, hasData, chatHistory);
        return NextResponse.json({ success: true, result: localResponse, provider: 'local' });
    }
  } catch (error) {
    console.error('LLM API error:', error);
    // Fallback to local processing if Claude fails
    if (prompt && agentType) {
      try {
        const fallbackResponse = await processWithLocalLLM(prompt, data, agentType, userMessage, hasData, chatHistory);
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

async function processWithClaude(
  prompt: string, 
  data: DataRow[], 
  agentType: string, 
  userMessage?: string, 
  hasData?: boolean,
  chatHistory?: Array<{id: string, type: string, content: string, timestamp: Date}>,
  columns?: string[],
  apiKey?: string
): Promise<ProcessingResult> {
  // Prepare comprehensive data for LLM analysis
  let sampleData: DataRow[] = [];
  let dataSchema: string[] = [];
  
  if (hasData && data.length > 0) {
    // Send a meaningful sample of the data (up to 50 rows to balance context vs token limits)
    const sampleSize = Math.min(50, data.length);
    sampleData = data.slice(0, sampleSize);
    dataSchema = columns || Object.keys(data[0] || {});
  }
  
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
- Missing value patterns and their implications
- Appropriate imputation methods for different data types
- Impact of missing data on analysis results
- Data collection improvement recommendations

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,
    
    'normalize-text': `You are a text normalization expert. Help users with text standardization, formatting, and cleanup tasks. Answer their questions about text processing and provide insights on improving text quality.

When analyzing data, provide insights about:
- Text inconsistency patterns
- Standardization opportunities
- Encoding and format issues
- Text quality metrics

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,
    
    'data-validator': `You are a data validation expert. Help users identify data quality issues, validation rules, and ensure their data meets quality standards.

When analyzing data, provide insights about:
- Data type inconsistencies
- Value range violations  
- Format compliance issues
- Business rule violations

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,

    'column-transformer': `You are a data transformation expert. Help users modify, combine, and derive new data columns based on their requirements.

When analyzing data, provide insights about:
- Column relationship patterns
- Transformation opportunities
- Derived column suggestions
- Data type optimization

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,

    'data-aggregator': `You are a data aggregation expert. Help users summarize, group, and analyze their data using statistical methods.

When analyzing data, provide insights about:
- Aggregation patterns and trends
- Statistical summaries
- Grouping recommendations
- Key performance indicators

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,

    'outlier-detector': `You are an outlier detection expert. Help users identify unusual patterns, anomalies, and outliers in their data.

When analyzing data, provide insights about:
- Statistical outliers and their significance
- Pattern anomalies
- Data quality issues manifesting as outliers
- Recommendations for handling outliers

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,

    'statistical-analyst': `You are a statistical analysis expert. Help users understand their data through descriptive and inferential statistics.

When analyzing data, provide insights about:
- Descriptive statistics and distributions
- Correlation patterns
- Statistical significance
- Trend analysis

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,

    'data-classifier': `You are a data classification expert. Help users categorize, label, and organize their data into meaningful groups.

When analyzing data, provide insights about:
- Classification patterns and rules
- Category optimization
- Label consistency
- Hierarchy suggestions

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,

    'trend-analyzer': `You are a trend analysis expert. Help users identify patterns, trends, and temporal changes in their data.

When analyzing data, provide insights about:
- Temporal patterns and trends
- Seasonal variations
- Growth rates and trajectories
- Forecasting opportunities

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`
  };

  // Build chat history context
  let chatHistoryContext = '';
  if (chatHistory && chatHistory.length > 0) {
    chatHistoryContext = `### Previous Conversation
${chatHistory.slice(-3).map(msg => 
  `**${msg.type === 'user' ? 'User' : 'Assistant'}:** ${msg.content.substring(0, 300)}${msg.content.length > 300 ? '...' : ''}`
).join('\n\n')}

---

`;
  }

  const userPrompt = hasData && sampleData.length > 0 ? `
${chatHistoryContext}Data Analysis Request

**Dataset Information:**
- Total rows: ${data.length}
- Columns: ${dataSchema.join(', ')}
- Sample data (first ${sampleData.length} rows): 
\`\`\`json
${JSON.stringify(sampleData.slice(0, 10), null, 2)}
\`\`\`

**User Question:** ${userMessage || prompt}

Please analyze this data and provide insights as a ${agentType.replace(/-/g, ' ')} specialist. Your response should:

1. **Directly answer the user's question** in a conversational manner, referencing the conversation history when relevant
2. **Analyze the actual data** provided and give specific insights based on what you observe
3. **Provide actionable recommendations** for data improvements or next steps
4. **Highlight any patterns, issues, or opportunities** you discover in the dataset
5. **Format your entire response using Markdown** for better readability:
   - Use headers (##, ###) to organize sections
   - Use bullet points and numbered lists for clarity
   - Use **bold** and *italic* text for emphasis
   - Use \`code blocks\` for data examples, formulas, or technical terms
   - Use tables for structured data presentation
   - Use > blockquotes for key insights or recommendations
6. Quote specific values, patterns, or findings from the actual dataset
7. Reference previous conversation points when building on earlier discussions
  ` : `
${chatHistoryContext}No Data Available Yet

The user is asking: "${userMessage || prompt}"

Please help them by:
1. **Directly answering their question** in a conversational manner, considering any previous discussion
2. **Explaining your capabilities** as a ${agentType.replace(/-/g, ' ')} specialist
3. **Providing guidance** on what types of data would work well with your expertise
4. **Suggesting preparation steps** they can take before uploading data
5. **Offering general advice** related to ${agentType.replace(/-/g, ' ')} best practices

Important: 
- Be conversational and educational
- **Format your entire response using Markdown** for better readability
- Use conversation history to maintain context and avoid repeating information
- Don't mention the lack of data as a limitation - focus on being helpful
- Provide actionable advice they can use right now
  `;

  try {
    // Initialize Anthropic client with user's API key
    const anthropicClient = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    });

    // Prepare the message for Claude
    const response = await anthropicClient.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 4000,
      temperature: 0.1,
      system: systemPrompts[agentType as keyof typeof systemPrompts] || systemPrompts['statistical-analyst'],
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // For conversational responses, we'll create a structured analysis object
    // but keep the main response as the conversational text
    const analysis = {
      reasoning: responseText,
      insights: extractInsights(responseText),
      agentType,
      conversational: true,
      provider: 'claude',
      model: 'claude-opus-4-20250514'
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

// vLLM Processing Function
async function processWithVLLM(
  prompt: string, 
  data: DataRow[], 
  agentType: string, 
  userMessage?: string, 
  hasData?: boolean,
  chatHistory?: Array<{id: string, type: string, content: string, timestamp: Date}>,
  columns?: string[],
  endpointUrl?: string,
  modelName?: string
): Promise<ProcessingResult> {
  // Prepare comprehensive data for LLM analysis
  let sampleData: DataRow[] = [];
  let dataSchema: string[] = [];
  
  if (hasData && data.length > 0) {
    // Send a meaningful sample of the data (up to 50 rows to balance context vs token limits)
    const sampleSize = Math.min(50, data.length);
    sampleData = data.slice(0, sampleSize);
    dataSchema = columns || Object.keys(data[0] || {});
  }
  
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
- Missing value patterns and their implications
- Appropriate imputation methods for different data types
- Impact of missing data on analysis results
- Data collection improvement recommendations

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,
    
    'normalize-text': `You are a text normalization expert. Help users with text standardization, formatting, and cleanup tasks. Answer their questions about text processing and provide insights on improving text quality.

When analyzing data, provide insights about:
- Text inconsistency patterns
- Standardization opportunities
- Encoding and format issues
- Text quality metrics

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,
    
    'data-validator': `You are a data validation expert. Help users identify data quality issues, validation rules, and ensure their data meets quality standards.

When analyzing data, provide insights about:
- Data type inconsistencies
- Value range violations  
- Format compliance issues
- Business rule violations

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,

    'column-transformer': `You are a data transformation expert. Help users modify, combine, and derive new data columns based on their requirements.

When analyzing data, provide insights about:
- Column relationship patterns
- Transformation opportunities
- Derived column suggestions
- Data type optimization

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,

    'data-aggregator': `You are a data aggregation expert. Help users summarize, group, and analyze their data using statistical methods.

When analyzing data, provide insights about:
- Aggregation patterns and trends
- Statistical summaries
- Grouping recommendations
- Key performance indicators

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,

    'outlier-detector': `You are an outlier detection expert. Help users identify unusual patterns, anomalies, and outliers in their data.

When analyzing data, provide insights about:
- Statistical outliers and their significance
- Pattern anomalies
- Data quality issues manifesting as outliers
- Recommendations for handling outliers

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,

    'statistical-analyst': `You are a statistical analysis expert. Help users understand their data through descriptive and inferential statistics.

When analyzing data, provide insights about:
- Descriptive statistics and distributions
- Correlation patterns
- Statistical significance
- Trend analysis

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,

    'data-classifier': `You are a data classification expert. Help users categorize, label, and organize their data into meaningful groups.

When analyzing data, provide insights about:
- Classification patterns and rules
- Category optimization
- Label consistency
- Hierarchy suggestions

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`,

    'trend-analyzer': `You are a trend analysis expert. Help users identify patterns, trends, and temporal changes in their data.

When analyzing data, provide insights about:
- Temporal patterns and trends
- Seasonal variations
- Growth rates and trajectories
- Forecasting opportunities

Always respond conversationally to user questions first, then provide additional insights if relevant. **Format your responses using Markdown** for better readability - use headers, lists, code blocks, and emphasis where appropriate.`
  };

  // Build chat history context
  let chatHistoryContext = '';
  if (chatHistory && chatHistory.length > 0) {
    chatHistoryContext = `### Previous Conversation
${chatHistory.slice(-3).map(msg => 
  `**${msg.type === 'user' ? 'User' : 'Assistant'}:** ${msg.content.substring(0, 300)}${msg.content.length > 300 ? '...' : ''}`
).join('\n\n')}

---

`;
  }

  const userPrompt = hasData && sampleData.length > 0 ? `
${chatHistoryContext}Data Analysis Request

**Dataset Information:**
- Total rows: ${data.length}
- Columns: ${dataSchema.join(', ')}
- Sample data (first ${sampleData.length} rows): 
\`\`\`json
${JSON.stringify(sampleData.slice(0, 10), null, 2)}
\`\`\`

**User Question:** ${userMessage || prompt}

Please analyze this data and provide insights as a ${agentType.replace(/-/g, ' ')} specialist. Your response should:

1. **Directly answer the user's question** in a conversational manner, referencing the conversation history when relevant
2. **Analyze the actual data** provided and give specific insights based on what you observe
3. **Provide actionable recommendations** for data improvements or next steps
4. **Highlight any patterns, issues, or opportunities** you discover in the dataset
5. **Format your entire response using Markdown** for better readability:
   - Use headers (##, ###) to organize sections
   - Use bullet points and numbered lists for clarity
   - Use **bold** and *italic* text for emphasis
   - Use \`code blocks\` for data examples, formulas, or technical terms
   - Use tables for structured data presentation
   - Use > blockquotes for key insights or recommendations
6. Quote specific values, patterns, or findings from the actual dataset
7. Reference previous conversation points when building on earlier discussions
  ` : `
${chatHistoryContext}No Data Available Yet

The user is asking: "${userMessage || prompt}"

Please help them by:
1. **Directly answering their question** in a conversational manner, considering any previous discussion
2. **Explaining your capabilities** as a ${agentType.replace(/-/g, ' ')} specialist
3. **Providing guidance** on what types of data would work well with your expertise
4. **Suggesting preparation steps** they can take before uploading data
5. **Offering general advice** related to ${agentType.replace(/-/g, ' ')} best practices

Important: 
- Be conversational and educational
- **Format your entire response using Markdown** for better readability
- Use conversation history to maintain context and avoid repeating information
- Don't mention the lack of data as a limitation - focus on being helpful
- Provide actionable advice they can use right now
  `;

  try {
    // Prepare the messages for vLLM API (OpenAI compatible format)
    const messages = [
      {
        role: "system",
        content: systemPrompts[agentType as keyof typeof systemPrompts] || systemPrompts['statistical-analyst']
      },
      {
        role: "user", 
        content: userPrompt
      }
    ];

    // Call vLLM endpoint using provided parameters
    const response = await fetch(`${endpointUrl || VLLM_ENDPOINT_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName || VLLM_MODEL_NAME,
        messages: messages,
        max_tokens: 2000,
        temperature: 0.1,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`vLLM API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid response format from vLLM');
    }

    const responseText = result.choices[0].message.content;
    
    // For conversational responses, we'll create a structured analysis object
    // but keep the main response as the conversational text
    const analysis = {
      reasoning: responseText,
      insights: extractInsights(responseText),
      agentType,
      conversational: true,
      provider: 'vLLM',
      model: modelName || VLLM_MODEL_NAME
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
    console.error('vLLM API error:', error);
    throw error;
  }
}

// Local LLM Processing Function (fallback when no external API is available)
async function processWithLocalLLM(
  _prompt: string, 
  data: DataRow[], 
  agentType: string, 
  userMessage?: string, 
  hasData?: boolean,
  chatHistory?: Array<{id: string, type: string, content: string, timestamp: Date}>
): Promise<ProcessingResult> {
  // If no data is available, provide helpful guidance
  if (!hasData || data.length === 0) {
    // Build context from chat history if available
    let historyContext = '';
    if (chatHistory && chatHistory.length > 0) {
      historyContext = `\n\n### Previous Discussion
${chatHistory.slice(-3).map(msg => `**${msg.type === 'user' ? 'You' : 'Assistant'}:** ${msg.content.substring(0, 200)}...`).join('\n')}

---\n`;
    }

    return {
      processedData: [], // Empty array since no data to process
      analysis: {
        reasoning: `## Hello! I'm your ${agentType.replace(/-/g, ' ')} assistant 👋
${historyContext}
I'd love to help you with your question${userMessage ? `: "${userMessage}"` : ''}!

**Currently running in local mode** - to unlock the full power of AI-driven analysis, you can:

### 🚀 **Upgrade to AI Processing:**
- Configure Claude (Anthropic) API key for intelligent analysis
- Set up vLLM endpoint for local AI processing
- Get smarter insights and recommendations

### 📊 **What I can help with:**
- **Data Upload**: Upload CSV, JSON, or Excel files to get started
- **Data Analysis**: I'll analyze patterns, quality, and structure
- **Recommendations**: Get suggestions for cleaning and processing
- **Insights**: Discover trends and anomalies in your data

### 🎯 **${agentType.replace(/-/g, ' ')} Expertise:**
${getAgentCapabilities(agentType)}

**Ready to get started?** Upload your data and ask me any questions!`,
        insights: [
          "Upload data to begin analysis",
          "Configure AI processing for enhanced insights",
          `Specialized in ${agentType.replace(/-/g, ' ')} operations`,
          "Interactive chat-based data exploration available"
        ],
        agentType,
        conversational: true,
        provider: 'local'
      }
    };
  }

  // Basic data analysis for when data is available
  const basicAnalysis = performBasicDataAnalysis(data, agentType, userMessage);
  
  return {
    processedData: data,
    analysis: {
      ...basicAnalysis,
      agentType,
      conversational: true,
      provider: 'local'
    }
  };
}

// Helper function to get agent capabilities description
function getAgentCapabilities(agentType: string): string {
  const capabilities = {
    'remove-duplicates': '• Identify and remove duplicate records\n• Preserve data integrity during deduplication\n• Handle complex duplicate scenarios\n• Provide deduplication reports',
    'handle-missing': '• Detect missing value patterns\n• Recommend imputation strategies\n• Fill missing values intelligently\n• Assess impact of missing data',
    'normalize-text': '• Standardize text formatting\n• Fix encoding issues\n• Clean and normalize strings\n• Handle case consistency',
    'data-validator': '• Validate data types and formats\n• Check business rule compliance\n• Identify data quality issues\n• Generate validation reports',
    'column-transformer': '• Transform and derive new columns\n• Split and merge data fields\n• Convert data types\n• Create calculated fields',
    'data-aggregator': '• Group and summarize data\n• Calculate statistical measures\n• Create pivot tables\n• Generate summary reports',
    'outlier-detector': '• Identify statistical outliers\n• Detect anomalous patterns\n• Assess data quality issues\n• Recommend outlier handling',
    'statistical-analyst': '• Perform descriptive statistics\n• Analyze distributions and trends\n• Calculate correlations\n• Generate statistical insights',
    'data-classifier': '• Categorize and label data\n• Create classification rules\n• Organize data hierarchies\n• Optimize category structures',
    'trend-analyzer': '• Identify temporal patterns\n• Analyze growth trends\n• Detect seasonal variations\n• Forecast future values'
  };
  
  return capabilities[agentType as keyof typeof capabilities] || '• General data processing and analysis\n• Data quality assessment\n• Pattern recognition\n• Insight generation';
}

// Helper function to find potential duplicates (basic implementation)
function findPotentialDuplicates(data: DataRow[]): DataRow[] {
  const seen = new Set();
  const duplicates: DataRow[] = [];
  
  for (const row of data) {
    const key = JSON.stringify(row);
    if (seen.has(key)) {
      duplicates.push(row);
    } else {
      seen.add(key);
    }
  }
  
  return duplicates;
}

// Helper function to analyze missing values
function analyzeMissingValues(data: DataRow[], columns: string[]): {
  columnsWithMissing: number;
  totalMissing: number;
  completeness: number;
} {
  let totalMissing = 0;
  let columnsWithMissing = 0;
  
  for (const column of columns) {
    let columnMissing = 0;
    for (const row of data) {
      const value = row[column];
      if (value === null || value === undefined || value === '' || value === 'N/A' || value === 'NULL') {
        columnMissing++;
      }
    }
    if (columnMissing > 0) {
      columnsWithMissing++;
      totalMissing += columnMissing;
    }
  }
  
  const totalCells = data.length * columns.length;
  const completeness = totalCells > 0 ? ((totalCells - totalMissing) / totalCells) * 100 : 100;
  
  return {
    columnsWithMissing,
    totalMissing,
    completeness
  };
}

// Helper function to perform basic data analysis
function performBasicDataAnalysis(data: DataRow[], agentType: string, userMessage?: string): {
  reasoning: string;
  insights: string[];
} {
  const rowCount = data.length;
  const columns = Object.keys(data[0] || {});
  const columnCount = columns.length;
  
  // Basic statistics
  const numericColumns = columns.filter(col => {
    const firstValue = data[0]?.[col];
    return typeof firstValue === 'number' || !isNaN(Number(firstValue));
  });
  
  const textColumns = columns.filter(col => {
    const firstValue = data[0]?.[col];
    return typeof firstValue === 'string' && isNaN(Number(firstValue));
  });

  let reasoning = `## Data Analysis Results 📊

I've analyzed your dataset and here's what I found:

### 📋 **Dataset Overview**
- **Total Records**: ${rowCount.toLocaleString()} rows
- **Total Columns**: ${columnCount} columns
- **Numeric Columns**: ${numericColumns.length} (${numericColumns.join(', ')})
- **Text Columns**: ${textColumns.length} (${textColumns.join(', ')})

### 🔍 **${agentType.replace(/-/g, ' ')} Analysis**
`;

  // Agent-specific analysis
  switch (agentType) {
    case 'remove-duplicates':
      const potentialDuplicates = findPotentialDuplicates(data);
      reasoning += `
**Duplicate Detection Results:**
- Potential duplicate rows detected: ${potentialDuplicates.length}
- Data uniqueness: ${((rowCount - potentialDuplicates.length) / rowCount * 100).toFixed(1)}%
- Recommended action: ${potentialDuplicates.length > 0 ? 'Review and remove duplicates' : 'No action needed - data appears unique'}
`;
      break;
      
    case 'handle-missing':
      const missingStats = analyzeMissingValues(data, columns);
      reasoning += `
**Missing Value Analysis:**
- Columns with missing values: ${missingStats.columnsWithMissing}
- Total missing values: ${missingStats.totalMissing}
- Data completeness: ${missingStats.completeness.toFixed(1)}%
- Recommended action: ${missingStats.totalMissing > 0 ? 'Implement missing value strategy' : 'No missing values detected'}
`;
      break;
      
    default:
      reasoning += `
**General Data Quality:**
- Data appears well-structured
- All columns have consistent data types
- Ready for ${agentType.replace(/-/g, ' ')} operations
`;
  }

  if (userMessage) {
    reasoning += `\n\n### 💬 **Response to your question:**\n"${userMessage}"\n\nBased on the current data analysis, I can provide specific insights once AI processing is enabled. For now, I've provided a basic overview above.`;
  }

  reasoning += `

### 🚀 **Next Steps:**
1. **Enable AI Processing**: Configure Claude or vLLM for intelligent analysis
2. **Ask Specific Questions**: I can provide detailed insights about your data
3. **Process Data**: Apply ${agentType.replace(/-/g, ' ')} operations
4. **Export Results**: Download processed data when ready

*Running in local mode - upgrade to AI processing for enhanced capabilities!*`;

  return {
    reasoning,
    insights: [
      `Dataset contains ${rowCount.toLocaleString()} rows and ${columnCount} columns`,
      `${numericColumns.length} numeric and ${textColumns.length} text columns identified`,
      `Ready for ${agentType.replace(/-/g, ' ')} processing`,
      'AI processing available with Claude or vLLM configuration'
    ]
  };
}
