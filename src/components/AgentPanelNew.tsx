"use client";

import { useState, useCallback } from "react";
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

export default function AgentPanel({ data, columns, onDataUpdate }: AgentPanelProps) {
  const [agents, setAgents] = useState<Agent[]>(availableAgents);
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createConversation = useCallback((agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const newConversation: AgentConversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId: agentId,
      name: `${agent.name} Chat`,
      messages: [],
      createdAt: new Date(),
      isActive: true
    };

    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(newConversation.id);
  }, [agents]);

  const selectConversation = useCallback((conversationId: string) => {
    setActiveConversation(conversationId);
  }, []);

  const sendMessage = useCallback(async (content: string, agentId: string, conversationId: string) => {
    if (!data.length) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      type: "user",
      content,
      timestamp: new Date()
    };

    // Add user message immediately
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

      // Prepare the prompt based on user message and agent type
      const contextPrompt = `You are an AI agent specialized in ${agentId.replace(/-/g, ' ')}. 
The user has uploaded a dataset with ${data.length} rows and ${columns.length} columns: [${columns.join(', ')}].

User request: ${content}

Please analyze the data and provide insights or perform the requested operation. Be specific and actionable in your response.`;

      // Call the LLM API
      const response = await fetch('/api/llm-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: contextPrompt,
          data: data,
          agentType: agentId,
          userMessage: content
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }

      // Create agent response message
      const agentMessage: ChatMessage = {
        id: `msg-${Date.now()}-agent`,
        type: "agent",
        content: result.result.analysis?.reasoning || result.result.message || "Analysis completed successfully",
        timestamp: new Date(),
        data: result.result.analysis || result.result
      };

      // Add agent response
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, messages: [...conv.messages, agentMessage] }
            : conv
        )
      );

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
      
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        type: "system",
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date()
      };

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, messages: [...conv.messages, errorMessage] }
            : conv
        )
      );

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
  }, [data, columns]);

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
