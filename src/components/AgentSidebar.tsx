"use client";

import { useState } from "react";
import { Plus, MessageSquare, Clock, CheckCircle } from "lucide-react";

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: "cleaning" | "transformation" | "analysis" | "visualization" | "ml" | "export";
  isRunning: boolean;
  lastRun?: Date;
  icon: string;
  color: string;
}

export interface AgentConversation {
  id: string;
  agentId: string;
  name: string;
  messages: ChatMessage[];
  createdAt: Date;
  isActive?: boolean;
}

export interface ChatMessage {
  id: string;
  type: "user" | "agent" | "system";
  content: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

interface AgentSidebarProps {
  agents: Agent[];
  conversations: AgentConversation[];
  activeConversation: string | null;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: (agentId: string) => void;
}

export default function AgentSidebar({
  agents,
  conversations,
  activeConversation,
  onSelectConversation,
  onCreateConversation
}: AgentSidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", name: "All Agents", count: agents.length },
    { id: "cleaning", name: "Data Cleaning", count: agents.filter(a => a.category === "cleaning").length },
    { id: "transformation", name: "Transformation", count: agents.filter(a => a.category === "transformation").length },
    { id: "analysis", name: "Analysis", count: agents.filter(a => a.category === "analysis").length },
    { id: "visualization", name: "Visualization", count: agents.filter(a => a.category === "visualization").length },
    { id: "ml", name: "Machine Learning", count: agents.filter(a => a.category === "ml").length },
    { id: "export", name: "Export", count: agents.filter(a => a.category === "export").length },
  ];

  const filteredAgents = selectedCategory === "all" 
    ? agents 
    : agents.filter(agent => agent.category === selectedCategory);

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Agents</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Choose an agent to start a conversation</p>
      </div>

      {/* Category Filter */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name} ({category.count})
            </option>
          ))}
        </select>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Available Agents
          </h3>
          
          {filteredAgents.map(agent => (
            <div
              key={agent.id}
              onClick={() => onCreateConversation(agent.id)}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${agent.color}`}>
                {agent.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {agent.name}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {agent.description}
                </p>
                {agent.lastRun && (
                  <div className="flex items-center space-x-1 mt-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Last run: {agent.lastRun.toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              <Plus className="w-4 h-4 text-gray-400" />
            </div>
          ))}
        </div>

        {/* Recent Conversations */}
        {conversations.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Recent Conversations
              </h3>
              
              {conversations.slice(0, 5).map(conversation => {
                const agent = agents.find(a => a.id === conversation.agentId);
                const lastMessage = conversation.messages[conversation.messages.length - 1];
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => onSelectConversation(conversation.id)}
                    className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      activeConversation === conversation.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${agent?.color || "bg-gray-500"}`}>
                      {agent?.icon || "🤖"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {conversation.name}
                      </h4>
                      {lastMessage && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {lastMessage.content.substring(0, 50)}...
                        </p>
                      )}
                      <div className="flex items-center space-x-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {conversation.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
