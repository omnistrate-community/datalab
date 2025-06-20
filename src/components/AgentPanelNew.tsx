"use client";

import { useState, useCallback, useEffect } from "react";
import AgentSidebar, { Agent, AgentConversation, ChatMessage } from "./AgentSidebar";
import AgentChat from "./AgentChat";
import { DataRow } from "@/types";

// Enhanced error handling interfaces
interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
}

// Agent performance tracking
interface AgentPerformance {
  agentId: string;
  executionTime: number;
  successRate: number;
  lastRun: Date;
  errorCount: number;
  totalRuns: number;
}

// Analytics tracking
interface AnalyticsEvent {
  type: 'agent_execution' | 'conversation_created' | 'error_occurred';
  agentId?: string;
  duration?: number;
  error?: string;
  timestamp: Date;
}

// Agent recommendation interface
interface AgentRecommendation {
  agentId: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface AgentPanelProps {
  data: DataRow[];
  columns: string[];
  onDataUpdate: (newData: DataRow[]) => void;
}

// Expanded list of available agents
const availableAgents: Agent[] = [
  // Data Cleaning Agents
  {
    id: "remove-duplicates",
    name: "Duplicate Remover",
    description: "Identifies and removes duplicate rows from your dataset while preserving data integrity",
    category: "cleaning",
    isRunning: false,
    icon: "🧹",
    color: "bg-red-500"
  },
  {
    id: "handle-missing",
    name: "Missing Value Handler",
    description: "Intelligently fills or removes missing values using statistical and contextual strategies",
    category: "cleaning",
    isRunning: false,
    icon: "🔧",
    color: "bg-orange-500"
  },
  {
    id: "normalize-text",
    name: "Text Normalizer",
    description: "Standardizes text formatting, case, encoding, and removes inconsistencies",
    category: "cleaning",
    isRunning: false,
    icon: "📝",
    color: "bg-yellow-500"
  },
  {
    id: "data-validator",
    name: "Data Validator",
    description: "Validates data types, formats, and business rules to ensure data quality",
    category: "cleaning",
    isRunning: false,
    icon: "✅",
    color: "bg-green-500"
  },

  // Data Transformation Agents
  {
    id: "column-transformer",
    name: "Column Transformer",
    description: "Transforms columns with operations like split, merge, derive new columns, and data type conversion",
    category: "transformation",
    isRunning: false,
    icon: "🔄",
    color: "bg-blue-500"
  },
  {
    id: "data-aggregator",
    name: "Data Aggregator",
    description: "Groups and aggregates data using various statistical functions and grouping strategies",
    category: "transformation",
    isRunning: false,
    icon: "📊",
    color: "bg-indigo-500"
  },
  {
    id: "data-joiner",
    name: "Data Joiner",
    description: "Merges and joins multiple datasets based on common keys and relationships",
    category: "transformation",
    isRunning: false,
    icon: "🔗",
    color: "bg-purple-500"
  },
  {
    id: "data-filter",
    name: "Smart Filter",
    description: "Applies intelligent filtering based on conditions, patterns, and statistical criteria",
    category: "transformation",
    isRunning: false,
    icon: "🔍",
    color: "bg-pink-500"
  },

  // Data Analysis Agents
  {
    id: "detect-outliers",
    name: "Outlier Detective",
    description: "Identifies statistical outliers and anomalies using multiple detection algorithms",
    category: "analysis",
    isRunning: false,
    icon: "🕵️",
    color: "bg-red-600"
  },
  {
    id: "generate-summary",
    name: "Data Summarizer",
    description: "Creates comprehensive statistical summaries, insights, and data profiling reports",
    category: "analysis",
    isRunning: false,
    icon: "📈",
    color: "bg-blue-600"
  },
  {
    id: "correlation-analyzer",
    name: "Correlation Analyzer",
    description: "Discovers relationships and correlations between variables in your dataset",
    category: "analysis",
    isRunning: false,
    icon: "🔬",
    color: "bg-green-600"
  },
  {
    id: "trend-analyzer",
    name: "Trend Analyzer",
    description: "Identifies patterns, trends, and seasonality in time-series and sequential data",
    category: "analysis",
    isRunning: false,
    icon: "📉",
    color: "bg-orange-600"
  },

  // Visualization Agents
  {
    id: "chart-recommender",
    name: "Chart Recommender",
    description: "Suggests optimal chart types and visualizations based on your data characteristics",
    category: "visualization",
    isRunning: false,
    icon: "📋",
    color: "bg-teal-500"
  },
  {
    id: "dashboard-builder",
    name: "Dashboard Builder",
    description: "Creates interactive dashboards with multiple visualizations and insights",
    category: "visualization",
    isRunning: false,
    icon: "📱",
    color: "bg-cyan-500"
  },

  // Machine Learning Agents
  {
    id: "pattern-finder",
    name: "Pattern Finder",
    description: "Uses machine learning to discover hidden patterns and clusters in your data",
    category: "ml",
    isRunning: false,
    icon: "🧠",
    color: "bg-violet-500"
  },
  {
    id: "prediction-model",
    name: "Prediction Model",
    description: "Builds predictive models for forecasting and classification tasks",
    category: "ml",
    isRunning: false,
    icon: "🔮",
    color: "bg-purple-600"
  },
  {
    id: "feature-engineer",
    name: "Feature Engineer",
    description: "Automatically creates and selects features for machine learning models",
    category: "ml",
    isRunning: false,
    icon: "⚙️",
    color: "bg-gray-600"
  },

  // Export Agents
  {
    id: "report-generator",
    name: "Report Generator",
    description: "Creates professional reports with insights, charts, and formatted data tables",
    category: "export",
    isRunning: false,
    icon: "📄",
    color: "bg-slate-600"
  },
  {
    id: "data-exporter",
    name: "Data Exporter",
    description: "Exports processed data to various formats (CSV, JSON, Excel, PDF) with custom formatting",
    category: "export",
    isRunning: false,
    icon: "💾",
    color: "bg-stone-600"
  },
];

interface DBConversation {
  id: string;
  agentId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  messages: DBMessage[];
}

interface DBMessage {
  id: string;
  type: string;
  content: string;
  data: string | null;
  createdAt: string;
}

export default function AgentPanel({ data, columns, onDataUpdate }: AgentPanelProps) {
  const [agents, setAgents] = useState<Agent[]>(availableAgents);
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<DatabaseError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Performance tracking
  const [agentPerformance, setAgentPerformance] = useState<Map<string, AgentPerformance>>(new Map());
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);

  // Analytics tracking function
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    setAnalytics(prev => [...prev.slice(-99), event]); // Keep last 100 events
  }, []);

  // Data validation and preprocessing
  const validateAndPreprocessData = useCallback((inputData: DataRow[], inputColumns: string[]) => {
    const validationResults = {
      isValid: true,
      warnings: [] as string[],
      errors: [] as string[],
      suggestions: [] as string[],
      processedData: inputData,
      processedColumns: inputColumns
    };

    // Check for empty dataset
    if (!inputData || inputData.length === 0) {
      validationResults.errors.push('Dataset is empty. Please upload data to begin analysis.');
      validationResults.isValid = false;
      return validationResults;
    }

    // Check for missing columns
    if (!inputColumns || inputColumns.length === 0) {
      validationResults.errors.push('No columns detected in dataset.');
      validationResults.isValid = false;
      return validationResults;
    }

    // Validate data consistency
    const expectedColumnCount = inputColumns.length;
    const inconsistentRows = inputData.filter(row => Object.keys(row).length !== expectedColumnCount);
    
    if (inconsistentRows.length > 0) {
      validationResults.warnings.push(`${inconsistentRows.length} rows have inconsistent column counts.`);
    }

    // Check for completely empty rows
    const emptyRows = inputData.filter(row => 
      Object.values(row).every(value => value === null || value === undefined || value === '')
    );
    
    if (emptyRows.length > 0) {
      validationResults.warnings.push(`${emptyRows.length} completely empty rows detected.`);
      validationResults.suggestions.push('Consider removing empty rows with the Data Cleaner agent.');
    }

    // Check for potential duplicates (basic check)
    const uniqueRowStrings = new Set(inputData.map(row => JSON.stringify(row)));
    if (uniqueRowStrings.size < inputData.length) {
      validationResults.warnings.push('Potential duplicate rows detected.');
      validationResults.suggestions.push('Use the Duplicate Remover agent to identify and handle duplicates.');
    }

    // Check for missing values
    const missingValueStats = inputColumns.map(col => {
      const missing = inputData.filter(row => row[col] === null || row[col] === undefined || row[col] === '').length;
      return { column: col, missing, percentage: (missing / inputData.length) * 100 };
    }).filter(stat => stat.missing > 0);

    if (missingValueStats.length > 0) {
      const highMissingCols = missingValueStats.filter(stat => stat.percentage > 20);
      if (highMissingCols.length > 0) {
        validationResults.warnings.push(`Columns with >20% missing values: ${highMissingCols.map(s => s.column).join(', ')}`);
        validationResults.suggestions.push('Use the Missing Value Handler agent to address missing data.');
      }
    }

    // Data type analysis
    const typeAnalysis = inputColumns.map(col => {
      const values = inputData.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
      const types = new Set(values.map(v => typeof v));
      return { column: col, types: Array.from(types), sampleCount: values.length };
    });

    const mixedTypeColumns = typeAnalysis.filter(analysis => analysis.types.length > 1);
    if (mixedTypeColumns.length > 0) {
      validationResults.warnings.push(`Mixed data types detected in: ${mixedTypeColumns.map(c => c.column).join(', ')}`);
      validationResults.suggestions.push('Use the Data Validator agent to standardize data types.');
    }

    return validationResults;
  }, []);

  // Get data insights for agent context
  const getDataInsights = useCallback((inputData: DataRow[], inputColumns: string[]) => {
    if (!inputData || inputData.length === 0) return null;

    return {
      rowCount: inputData.length,
      columnCount: inputColumns.length,
      estimatedSize: `${(JSON.stringify(inputData).length / 1024).toFixed(1)} KB`,
      hasNumericData: inputColumns.some(col => 
        inputData.some(row => typeof row[col] === 'number' && !isNaN(row[col]))
      ),
      hasTextData: inputColumns.some(col => 
        inputData.some(row => typeof row[col] === 'string' && row[col].length > 0)
      ),
      hasDates: inputColumns.some(col => 
        inputData.some(row => {
          const value = row[col];
          return typeof value === 'string' && !isNaN(Date.parse(value));
        })
      )
    };
  }, []);

  // Get agent recommendations based on data characteristics
  const getAgentRecommendations = useCallback((inputData: DataRow[], inputColumns: string[]): AgentRecommendation[] => {
    const recommendations: AgentRecommendation[] = [];
    
    if (!inputData || inputData.length === 0) {
      return [{
        agentId: 'data-exporter',
        reason: 'Upload data to get started with AI-powered analysis',
        priority: 'high'
      }];
    }

    const dataInsights = getDataInsights(inputData, inputColumns);
    const validation = validateAndPreprocessData(inputData, inputColumns);

    // Recommend based on data quality issues
    if (validation.warnings.some(w => w.includes('duplicate'))) {
      recommendations.push({
        agentId: 'remove-duplicates',
        reason: 'Duplicate rows detected in your dataset',
        priority: 'high'
      });
    }

    if (validation.warnings.some(w => w.includes('missing values'))) {
      recommendations.push({
        agentId: 'handle-missing',
        reason: 'Missing values found - clean your data for better analysis',
        priority: 'high'
      });
    }

    if (validation.warnings.some(w => w.includes('Mixed data types'))) {
      recommendations.push({
        agentId: 'data-validator',
        reason: 'Mixed data types detected - standardize for consistency',
        priority: 'medium'
      });
    }

    // Recommend based on data characteristics
    if (dataInsights?.hasNumericData) {
      recommendations.push({
        agentId: 'detect-outliers',
        reason: 'Numeric data detected - identify statistical outliers',
        priority: 'medium'
      });
      
      recommendations.push({
        agentId: 'correlation-analyzer',
        reason: 'Analyze relationships between numeric variables',
        priority: 'low'
      });
    }

    if (dataInsights?.hasDates) {
      recommendations.push({
        agentId: 'trend-analyzer',
        reason: 'Time-series data detected - analyze trends and patterns',
        priority: 'medium'
      });
    }

    // Always recommend data summary for new datasets
    if (inputData.length > 0) {
      recommendations.push({
        agentId: 'generate-summary',
        reason: 'Get comprehensive insights about your dataset',
        priority: 'low'
      });
    }

    // Remove duplicates and sort by priority
    const uniqueRecommendations = recommendations.filter((rec, index) => 
      recommendations.findIndex(r => r.agentId === rec.agentId) === index
    );

    const priorityOrder: Record<AgentRecommendation['priority'], number> = { 'high': 3, 'medium': 2, 'low': 1 };
    return uniqueRecommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }, [getDataInsights, validateAndPreprocessData]);

  // Get current agent recommendations
  const agentRecommendations = getAgentRecommendations(data, columns);

  // Update agent performance metrics
  const updateAgentPerformance = useCallback((agentId: string, success: boolean, executionTime: number) => {
    setAgentPerformance(prev => {
      const current = prev.get(agentId) || {
        agentId,
        executionTime: 0,
        successRate: 100,
        lastRun: new Date(),
        errorCount: 0,
        totalRuns: 0
      };

      const newTotalRuns = current.totalRuns + 1;
      const newErrorCount = success ? current.errorCount : current.errorCount + 1;
      const newSuccessRate = ((newTotalRuns - newErrorCount) / newTotalRuns) * 100;
      const avgExecutionTime = (current.executionTime * current.totalRuns + executionTime) / newTotalRuns;

      const updated = {
        ...current,
        executionTime: avgExecutionTime,
        successRate: newSuccessRate,
        lastRun: new Date(),
        errorCount: newErrorCount,
        totalRuns: newTotalRuns
      };

      const newMap = new Map(prev);
      newMap.set(agentId, updated);
      return newMap;
    });
  }, []);

  // Enhanced retry logic with exponential backoff
  const retryWithBackoff = useCallback(async (operation: () => Promise<any>, maxRetries = 3): Promise<any> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        setRetryCount(0); // Reset retry count on success
        setLastError(null); // Clear any previous errors
        return result;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        setRetryCount(attempt + 1);
      }
    }
  }, []);

  // Enhanced error clearing
  const clearError = useCallback(() => {
    setLastError(null);
    setRetryCount(0);
  }, []);

  // Load conversations from database on component mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        await retryWithBackoff(async () => {
          const response = await fetch('/api/conversations');
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const { conversations: dbConversations }: { conversations: DBConversation[] } = await response.json();
          const convertedConversations = dbConversations.map((conv: DBConversation) => ({
            id: conv.id,
            agentId: conv.agentId,
            name: conv.name,
            messages: conv.messages.map((msg: DBMessage) => ({
              id: msg.id,
              type: msg.type as "user" | "agent" | "system",
              content: msg.content,
              timestamp: new Date(msg.createdAt),
              data: msg.data ? JSON.parse(msg.data) : undefined
            })),
            createdAt: new Date(conv.createdAt),
            isActive: conv.isActive
          }));
          setConversations(convertedConversations);
          
          if (convertedConversations.length > 0 && !activeConversation) {
            setActiveConversation(convertedConversations[0].id);
          }
        });
      } catch (error) {
        console.error('Failed to load conversations:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load conversations. Please try again later.';
        setLastError({ message: errorMessage, code: 'CONVERSATION_LOAD_FAILED' });
      }
    };
    
    loadConversations();
  }, [activeConversation, retryWithBackoff]);

  // Remove localStorage effects - now using database
  // Save conversations to localStorage whenever they change
  // useEffect(() => {
  //   try {
  //     localStorage.setItem('datalab-conversations', JSON.stringify(conversations));
  //   } catch (error) {
  //     console.error('Failed to save conversations to localStorage:', error);
  //   }
  // }, [conversations]);

  // Save active conversation to localStorage whenever it changes
  // useEffect(() => {
  //   if (activeConversation) {
  //     try {
  //       localStorage.setItem('datalab-active-conversation', activeConversation);
  //     } catch (error) {
  //       console.error('Failed to save active conversation to localStorage:', error);
  //     }
  //   }
  // }, [activeConversation]);

  // Validate active conversation exists, otherwise reset it
  useEffect(() => {
    if (activeConversation && !conversations.find(c => c.id === activeConversation)) {
      setActiveConversation(conversations.length > 0 ? conversations[0].id : null);
    }
  }, [activeConversation, conversations]);

  // Helper function to add a conversation with database storage and retry logic
  const addConversation = useCallback(async (agentId: string, name: string) => {
    try {
      return await retryWithBackoff(async () => {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId, name })
        });
        
        if (response.ok) {
          const { conversation } = await response.json();
          const newConversation = {
            id: conversation.id,
            agentId: conversation.agentId,
            name: conversation.name,
            messages: [],
            createdAt: new Date(conversation.createdAt),
            isActive: conversation.isActive
          };
          
          setConversations(prev => [newConversation, ...prev]);
          return newConversation.id;
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create conversation');
        }
      });
    } catch (error) {
      console.error('Failed to create conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create conversation. Please try again.';
      setLastError({ message: errorMessage, code: 'CONVERSATION_CREATION_FAILED' });
    }
    return null;
  }, [retryWithBackoff]);

  const createConversation = useCallback(async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const conversationId = await addConversation(agentId, `${agent.name} Chat`);
    if (conversationId) {
      setActiveConversation(conversationId);
    }
  }, [agents, addConversation]);

  const selectConversation = useCallback((conversationId: string) => {
    setActiveConversation(conversationId);
  }, []);

  const sendMessage = useCallback(async (content: string, agentId: string, conversationId: string) => {
    const executionStartTime = Date.now();
    
    // Track conversation interaction
    trackEvent({
      type: 'agent_execution',
      agentId,
      timestamp: new Date()
    });

    // Save user message to database first, then add to local state
    let userMessageId = `msg-${Date.now()}-user`; // fallback ID
    try {
      const userMessageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          type: 'user',
          content
        })
      });

      if (userMessageResponse.ok) {
        const { message: savedUserMessage } = await userMessageResponse.json();
        userMessageId = savedUserMessage.id;
      } else {
        const errorData = await userMessageResponse.json();
        throw new Error(errorData.message || 'Failed to save user message');
      }
    } catch (error) {
      console.error('Failed to save user message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save user message. Please try again.';
      setLastError({ message: errorMessage, code: 'USER_MESSAGE_SAVE_FAILED' });
      
      // Track error
      trackEvent({
        type: 'error_occurred',
        agentId,
        error: errorMessage,
        timestamp: new Date()
      });
      
      updateAgentPerformance(agentId, false, Date.now() - executionStartTime);
      return;
    }

    const userMessage: ChatMessage = {
      id: userMessageId,
      type: "user",
      content,
      timestamp: new Date()
    };

    // Add user message to local state
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, messages: [...conv.messages, userMessage] }
          : conv
      )
    );

    setIsLoading(true);

    try {
      // Update agent running status
      setAgents(prev => 
        prev.map(agent => 
          agent.id === agentId 
            ? { ...agent, isRunning: true }
            : agent
        )
      );

      // Prepare context-aware prompt based on data availability
      let contextPrompt: string;
      
      if (data.length > 0) {
        // Data is available - include data context
        contextPrompt = `You are an AI agent specialized in ${agentId.replace(/-/g, ' ')}. 
The user has uploaded a dataset with ${data.length} rows and ${columns.length} columns: [${columns.join(', ')}].

User request: ${content}

Please analyze the data and provide insights or perform the requested operation. Be specific and actionable in your response.`;
      } else {
        // No data uploaded yet - provide helpful guidance
        contextPrompt = `You are an AI agent specialized in ${agentId.replace(/-/g, ' ')}. 
The user hasn't uploaded any data yet, but they're asking: ${content}

Please help them by:
1. Explaining how you can assist with ${agentId.replace(/-/g, ' ')} tasks
2. Providing guidance on what data would be suitable for your capabilities
3. Answering their question in a helpful and conversational manner
4. Suggesting next steps for uploading and preparing data

Be helpful, conversational, and educational.`;
      }

      // Get current conversation history (excluding the message we just added)
      const currentConversation = conversations.find(c => c.id === conversationId);
      const chatHistory = currentConversation ? currentConversation.messages.slice(0, -1) : []; // Exclude the user message we just added

      // Validate and analyze data before sending to agent
      const dataValidation = validateAndPreprocessData(data, columns);
      const dataInsights = getDataInsights(data, columns);

      // Enhanced context with validation results
      let enhancedPrompt = contextPrompt;
      if (data.length > 0 && dataValidation.warnings.length > 0) {
        enhancedPrompt += `\n\nData Quality Insights:
- Warnings: ${dataValidation.warnings.join('; ')}
${dataValidation.suggestions.length > 0 ? `- Suggestions: ${dataValidation.suggestions.join('; ')}` : ''}

Please consider these data quality aspects in your analysis and mention them if relevant to the user's request.`;
      }

      // Call the LLM API
      const response = await fetch('/api/llm-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          data: dataValidation.processedData, // Send validated/processed data
          agentType: agentId,
          userMessage: content,
          hasData: data.length > 0, // Flag to indicate data availability
          chatHistory: chatHistory, // Include full conversation history
          columns: dataValidation.processedColumns, // Include processed column information
          dataInsights: dataInsights, // Include data insights
          dataValidation: dataValidation // Include validation results
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }

      // Create and save agent response message to database
      const agentMessageContent = result.result.analysis?.reasoning || result.result.message || "Analysis completed successfully";
      const agentMessageData = result.result.analysis || result.result;

      // Save agent response to database
      const agentMessageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          type: 'agent',
          content: agentMessageContent,
          data: agentMessageData
        })
      });

      if (agentMessageResponse.ok) {
        const { message: savedAgentMessage } = await agentMessageResponse.json();
        const agentMessage: ChatMessage = {
          id: savedAgentMessage.id,
          type: "agent",
          content: agentMessageContent,
          timestamp: new Date(savedAgentMessage.createdAt),
          data: agentMessageData
        };

        // Add agent response to local state
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, messages: [...conv.messages, agentMessage] }
              : conv
          )
        );
      } else {
        const errorData = await agentMessageResponse.json();
        throw new Error(errorData.message || 'Failed to save agent message');
      }

      // Update agent last run time
      setAgents(prev =>
        prev.map(agent =>
          agent.id === agentId
            ? { ...agent, isRunning: false, lastRun: new Date() }
            : agent
        )
      );

      // Track successful agent execution
      const executionTime = Date.now() - executionStartTime;
      trackEvent({
        type: 'agent_execution',
        agentId,
        duration: executionTime,
        timestamp: new Date()
      });

      // Update agent performance metrics
      updateAgentPerformance(agentId, true, executionTime);

    } catch (error) {
      console.error('Agent execution error:', error);
      
      const errorContent = `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
      
      // Save error message to database
      try {
        const errorMessageResponse = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            type: 'system',
            content: errorContent
          })
        });

        if (errorMessageResponse.ok) {
          const { message: savedErrorMessage } = await errorMessageResponse.json();
          const errorMessage: ChatMessage = {
            id: savedErrorMessage.id,
            type: "system",
            content: errorContent,
            timestamp: new Date(savedErrorMessage.createdAt)
          };

          setConversations(prev => 
            prev.map(conv => 
              conv.id === conversationId 
                ? { ...conv, messages: [...conv.messages, errorMessage] }
                : conv
            )
          );
        } else {
          const errorData = await errorMessageResponse.json();
          throw new Error(errorData.message || 'Failed to save error message');
        }
      } catch (dbError) {
        console.error('Failed to save error message to database:', dbError);
        // Fallback to local state only
        const errorMessage: ChatMessage = {
          id: `msg-${Date.now()}-error`,
          type: "system",
          content: errorContent,
          timestamp: new Date()
        };

        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, messages: [...conv.messages, errorMessage] }
              : conv
          )
        );
      }

      setAgents(prev =>
        prev.map(agent =>
          agent.id === agentId
            ? { ...agent, isRunning: false }
            : agent
        )
      );

      // Track failed agent execution
      const executionTime = Date.now() - executionStartTime;
      trackEvent({
        type: 'error_occurred',
        agentId,
        duration: executionTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });

      // Update agent performance metrics
      updateAgentPerformance(agentId, false, executionTime);
    } finally {
      setIsLoading(false);
    }
  }, [data, columns, conversations, trackEvent, updateAgentPerformance, validateAndPreprocessData, getDataInsights]);

  const currentConversation = conversations.find(c => c.id === activeConversation);
  const currentAgent = currentConversation ? agents.find(a => a.id === currentConversation.agentId) : null;

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Error Notification */}
      {lastError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {lastError.code ? `Error (${lastError.code})` : 'Error'}
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {lastError.message}
                  {retryCount > 0 && ` (Retry attempt: ${retryCount})`}
                </p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="ml-auto flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Performance Dashboard - Show when there's performance data */}
      {agentPerformance.size > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Agent Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from(agentPerformance.entries()).slice(0, 3).map(([agentId, performance]) => {
              const agent = agents.find(a => a.id === agentId);
              return (
                <div key={agentId} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {agent?.name || agentId}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      performance.successRate >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      performance.successRate >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {performance.successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Avg Time:</span>
                      <span>{(performance.executionTime / 1000).toFixed(2)}s</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Total Runs:</span>
                      <span>{performance.totalRuns}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agent Recommendations */}
      {agentRecommendations.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
            🤖 Recommended Agents for Your Data
          </h3>
          <div className="space-y-2">
            {agentRecommendations.slice(0, 3).map((recommendation: AgentRecommendation, index: number) => {
              const agent = agents.find(a => a.id === recommendation.agentId);
              return (
                <div key={recommendation.agentId} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-600">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${agent?.color || 'bg-gray-500'} text-white`}>
                      {agent?.icon || '🤖'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {agent?.name || recommendation.agentId}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {recommendation.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      recommendation.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                      recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {recommendation.priority}
                    </span>
                    <button
                      onClick={() => createConversation(recommendation.agentId)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors"
                    >
                      Try Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <AgentSidebar
          agents={agents}
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={selectConversation}
          onCreateConversation={createConversation}
        />
        
        <AgentChat
          conversation={currentConversation || null}
          agent={currentAgent || null}
          data={data}
          onSendMessage={sendMessage}
          onDataUpdate={onDataUpdate}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
