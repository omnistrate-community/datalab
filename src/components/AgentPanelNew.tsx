"use client";

import { useState, useCallback, useEffect } from "react";
import AgentSidebar, { Agent, AgentConversation, ChatMessage } from "./AgentSidebar";
import AgentChat from "./AgentChat";
import { DataRow } from "@/types";

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

  // Load conversations from database on component mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch('/api/conversations');
        if (response.ok) {
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
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };
    
    loadConversations();
  }, [activeConversation]);

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

  // Helper function to add a conversation with database storage
  const addConversation = useCallback(async (agentId: string, name: string) => {
    try {
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
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
    return null;
  }, []);

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
      }
    } catch (error) {
      console.error('Failed to save user message:', error);
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

      // Call the LLM API
      const response = await fetch('/api/llm-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: contextPrompt,
          data: data.length > 0 ? data : [], // Send full dataset, not just sample
          agentType: agentId,
          userMessage: content,
          hasData: data.length > 0, // Flag to indicate data availability
          chatHistory: chatHistory, // Include full conversation history
          columns: columns // Include column information
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
      }

      // Update agent last run time
      setAgents(prev =>
        prev.map(agent =>
          agent.id === agentId
            ? { ...agent, isRunning: false, lastRun: new Date() }
            : agent
        )
      );

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
    } finally {
      setIsLoading(false);
    }
  }, [data, columns, conversations]);

  const currentConversation = conversations.find(c => c.id === activeConversation);
  const currentAgent = currentConversation ? agents.find(a => a.id === currentConversation.agentId) : null;

  return (
    <div className="flex h-[calc(100vh-12rem)] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
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
  );
}
