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
      const reasoning = result.result.analysis.reasoning;
      let messageText = 'Processing completed successfully';
      
      // Handle different types of reasoning responses
      if (typeof reasoning === 'string') {
        messageText = reasoning;
      } else if (typeof reasoning === 'object' && reasoning !== null) {
        // If reasoning is an object, create a meaningful message
        const reasoningObj = reasoning as Record<string, unknown>;
        if (reasoningObj.dataQuality || reasoningObj.dataCharacteristics) {
          messageText = 'Analysis completed successfully with detailed insights';
        } else {
          messageText = 'Analysis completed with detailed results';
        }
      }

      // Clean the analysis object to ensure all values are serializable
      const cleanAnalysis = { ...result.result.analysis };
      
      setResults(prev => ({ 
        ...prev, 
        [agentId]: {
          message: messageText,
          ...cleanAnalysis
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
                      <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-3">
                        {results[agent.id].message}
                      </p>
                      
                      {/* Render insights if available */}
                      {(() => {
                        try {
                          const insights = results[agent.id].insights;
                          return insights && Array.isArray(insights) ? (
                            <div className="mb-3">
                              <h6 className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">Key Insights:</h6>
                              <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                                {insights.slice(0, 3).map((insight, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="mr-1">•</span>
                                    <span>{String(insight)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null;
                        } catch (error) {
                          console.error('Error rendering insights:', error);
                          return null;
                        }
                      })()}

                      {/* Render other analysis results */}
                      {(() => {
                        try {
                          const result = results[agent.id];
                          return Object.entries(result)
                            .filter(([key]) => !["message", "error", "insights", "reasoning"].includes(key))
                            .map(([key, value]) => {
                              // Skip invalid or non-renderable values
                              if (value === undefined || value === null) return null;
                              
                              try {
                                return (
                                  <div key={key} className="mb-2">
                                    <h6 className="text-xs font-semibold text-green-700 dark:text-green-300 capitalize mb-1">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                                    </h6>
                                    <div className="pl-2">
                                      {typeof value === 'object' && value !== null ? (
                                        <pre className="whitespace-pre-wrap text-xs bg-green-100 dark:bg-green-900/30 p-2 rounded border overflow-x-auto max-h-32">
                                          {JSON.stringify(value, null, 2)}
                                        </pre>
                                      ) : (
                                        <span className="text-xs text-green-700 dark:text-green-300">{String(value)}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              } catch (renderError) {
                                console.error('Error rendering field:', key, renderError);
                                return null;
                              }
                            });
                        } catch (error) {
                          console.error('Error rendering analysis results:', error);
                          return null;
                        }
                      })()}

                      {/* Special handling for reasoning object */}
                      {(() => {
                        try {
                          const reasoning = results[agent.id].reasoning;
                          return reasoning && typeof reasoning === 'object' && reasoning !== null ? (
                            <div className="mb-2">
                              <h6 className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">Analysis Details:</h6>
                              <div className="pl-2 space-y-1">
                                {Object.entries(reasoning as Record<string, unknown>).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="text-xs font-medium text-green-700 dark:text-green-300 capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                                    </span>
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 pl-2">
                                      {String(value)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null;
                        } catch (error) {
                          console.error('Error rendering reasoning:', error);
                          return null;
                        }
                      })()}
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
