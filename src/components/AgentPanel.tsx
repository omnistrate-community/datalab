"use client";

import { useState } from "react";
import { Bot, Play, CheckCircle } from "lucide-react";
import { DataRow } from "@/types";

interface AgentPanelProps {
  data: DataRow[];
  columns: string[];
  onDataUpdate: (newData: DataRow[]) => void;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  category: "cleaning" | "transformation" | "analysis";
  isRunning: boolean;
  lastRun?: Date;
}

const availableAgents: Agent[] = [
  {
    id: "remove-duplicates",
    name: "Remove Duplicates",
    description: "Identifies and removes duplicate rows from your dataset",
    category: "cleaning",
    isRunning: false,
  },
  {
    id: "handle-missing",
    name: "Handle Missing Values",
    description: "Fills or removes missing values using intelligent strategies",
    category: "cleaning",
    isRunning: false,
  },
  {
    id: "normalize-text",
    name: "Normalize Text",
    description: "Standardizes text formatting, case, and removes extra whitespace",
    category: "cleaning",
    isRunning: false,
  },
  {
    id: "detect-outliers",
    name: "Detect Outliers",
    description: "Identifies statistical outliers in numerical columns",
    category: "analysis",
    isRunning: false,
  },
  {
    id: "generate-summary",
    name: "Generate Summary",
    description: "Creates statistical summaries and insights about your data",
    category: "analysis",
    isRunning: false,
  },
];

export default function AgentPanel({ data, onDataUpdate }: AgentPanelProps) {
  const [agents, setAgents] = useState<Agent[]>(availableAgents);
  const [results, setResults] = useState<Record<string, { message: string; [key: string]: unknown }>>({});

  const runAgent = async (agentId: string) => {
    if (!data.length) return;

    setAgents(prev => 
      prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, isRunning: true }
          : agent
      )
    );

    try {
      // Prepare the prompt based on agent type
      const prompts = {
        'remove-duplicates': `Analyze this dataset and identify duplicate rows. Remove duplicates while preserving data integrity.`,
        'handle-missing': `Analyze missing values in this dataset and fill them using intelligent strategies based on data types and patterns.`,
        'normalize-text': `Normalize text data in this dataset by standardizing formatting, capitalization, and removing inconsistencies.`,
        'detect-outliers': `Analyze this dataset to detect statistical outliers in numeric columns using appropriate methods.`,
        'generate-summary': `Generate a comprehensive statistical summary and insights for this dataset including data types, distributions, and key findings.`
      };

      const prompt = prompts[agentId as keyof typeof prompts] || 'Process this data intelligently.';

      // Call the LLM API
      const response = await fetch('/api/llm-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          data,
          agentType: agentId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }

      // Update the results with LLM analysis
      setResults(prev => ({ 
        ...prev, 
        [agentId]: {
          message: result.result.analysis.reasoning || 'Processing completed successfully',
          ...result.result.analysis
        } as { message: string; [key: string]: unknown }
      }));

      // Update data if the agent modified it
      if (result.result.processedData && ['remove-duplicates', 'handle-missing', 'normalize-text'].includes(agentId)) {
        onDataUpdate(result.result.processedData);
      }

      setAgents(prev =>
        prev.map(agent =>
          agent.id === agentId
            ? { ...agent, isRunning: false, lastRun: new Date() }
            : agent
        )
      );

    } catch (error) {
      console.error('Agent execution error:', error);
      setResults(prev => ({ 
        ...prev, 
        [agentId]: {
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          error: true
        } as { message: string; [key: string]: unknown }
      }));
      
      setAgents(prev =>
        prev.map(agent =>
          agent.id === agentId
            ? { ...agent, isRunning: false }
            : agent
        )
      );
    }
  };

  const categories = ["cleaning", "transformation", "analysis"] as const;

  if (!data.length) {
    return (
      <div className="text-center py-12">
        <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Upload data to start using AI agents for processing and analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          AI Data Processing Agents
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Select agents to clean, transform, and analyze your data
        </p>
      </div>

      {categories.map(category => (
        <div key={category} className="space-y-3">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 capitalize">
            {category} Agents
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            {agents
              .filter(agent => agent.category === category)
              .map(agent => (
                <div
                  key={agent.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-5 h-5 text-blue-600" />
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {agent.name}
                      </h5>
                    </div>
                    {agent.lastRun && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {agent.description}
                  </p>
                  
                  <button
                    onClick={() => runAgent(agent.id)}
                    disabled={agent.isRunning}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                  >
                    {agent.isRunning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Run Agent</span>
                      </>
                    )}
                  </button>
                  
                  {results[agent.id] && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        {results[agent.id].message}
                      </p>
                      {Object.entries(results[agent.id])
                        .filter(([key]) => key !== "message")
                        .map(([key, value]) => (
                          <p key={key} className="text-xs text-green-700 dark:text-green-300 mt-1">
                            {key}: {String(value)}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
