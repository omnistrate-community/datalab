"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, AlertCircle, Copy, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { AgentConversation, ChatMessage, Agent } from "./AgentSidebar";
import { DataRow } from "@/types";

// Import highlight.js CSS for syntax highlighting
import 'highlight.js/styles/github.css';

interface AgentChatProps {
  conversation: AgentConversation | null;
  agent: Agent | null;
  data: DataRow[];
  onSendMessage: (content: string, agentId: string, conversationId: string) => void;
  onDataUpdate: (newData: DataRow[]) => void;
  isLoading: boolean;
}

export default function AgentChat({
  conversation,
  agent,
  data,
  onSendMessage,
  onDataUpdate,
  isLoading
}: AgentChatProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const handleSend = () => {
    if (!message.trim() || !agent || !conversation || isLoading) return;
    
    onSendMessage(message.trim(), agent.id, conversation.id);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessageContent = (message: ChatMessage) => {
    // Handle data results
    if (message.data && typeof message.data === "object") {
      const data = message.data as Record<string, unknown>;
      
      return (
        <div className="space-y-3">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Custom styling for markdown elements
                h1: ({children}) => <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{children}</h1>,
                h2: ({children}) => <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{children}</h2>,
                h3: ({children}) => <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{children}</h3>,
                p: ({children}) => <p className="text-gray-800 dark:text-gray-200 mb-2 leading-relaxed">{children}</p>,
                ul: ({children}) => <ul className="list-disc list-inside text-gray-800 dark:text-gray-200 space-y-1 mb-2">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside text-gray-800 dark:text-gray-200 space-y-1 mb-2">{children}</ol>,
                li: ({children}) => <li className="text-gray-800 dark:text-gray-200">{children}</li>,
                code: ({children, className}) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-gray-900 dark:text-gray-100">
                      {children}
                    </code>
                  ) : (
                    <code className={className}>{children}</code>
                  );
                },
                pre: ({children}) => (
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-sm border border-gray-200 dark:border-gray-700">
                    {children}
                  </pre>
                ),
                blockquote: ({children}) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 py-2 rounded-r">
                    {children}
                  </blockquote>
                ),
                table: ({children}) => (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                th: ({children}) => (
                  <th className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    {children}
                  </th>
                ),
                td: ({children}) => (
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    {children}
                  </td>
                ),
                strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                em: ({children}) => <em className="italic text-gray-800 dark:text-gray-200">{children}</em>,
                a: ({children, href}) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          
          {/* Render insights if available */}
          {data.insights && Array.isArray(data.insights) ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Key Insights:</h4>
              <ul className="space-y-1">
                {data.insights.slice(0, 5).map((insight: unknown, idx: number) => (
                  <li key={idx} className="flex items-start text-sm text-blue-800 dark:text-blue-200">
                    <span className="mr-2">•</span>
                    <span>{String(insight)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Render statistics or summary data */}
          {data.statistics && typeof data.statistics === "object" ? (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Statistics:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(data.statistics as Record<string, unknown>).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="font-medium text-green-800 dark:text-green-200">
                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Render data quality issues */}
          {data.dataQuality && typeof data.dataQuality === "object" ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Data Quality Issues:</h4>
              <div className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                {Object.entries(data.dataQuality as Record<string, unknown>).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {String(value)}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Render processing results */}
          {data.processedData && Array.isArray(data.processedData) ? (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Processed Data Available</h4>
                <button
                  onClick={() => onDataUpdate(data.processedData as DataRow[])}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Apply Changes
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data.processedData.length} rows processed
              </p>
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            // Custom styling for markdown elements
            h1: ({children}) => <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{children}</h1>,
            h2: ({children}) => <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{children}</h2>,
            h3: ({children}) => <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{children}</h3>,
            p: ({children}) => <p className="text-gray-800 dark:text-gray-200 mb-2 leading-relaxed">{children}</p>,
            ul: ({children}) => <ul className="list-disc list-inside text-gray-800 dark:text-gray-200 space-y-1 mb-2">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal list-inside text-gray-800 dark:text-gray-200 space-y-1 mb-2">{children}</ol>,
            li: ({children}) => <li className="text-gray-800 dark:text-gray-200">{children}</li>,
            code: ({children, className}) => {
              const isInline = !className;
              return isInline ? (
                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-gray-900 dark:text-gray-100">
                  {children}
                </code>
              ) : (
                <code className={className}>{children}</code>
              );
            },
            pre: ({children}) => (
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-sm border border-gray-200 dark:border-gray-700">
                {children}
              </pre>
            ),
            blockquote: ({children}) => (
              <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 py-2 rounded-r">
                {children}
              </blockquote>
            ),
            table: ({children}) => (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                  {children}
                </table>
              </div>
            ),
            th: ({children}) => (
              <th className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                {children}
              </th>
            ),
            td: ({children}) => (
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                {children}
              </td>
            ),
            strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
            em: ({children}) => <em className="italic text-gray-800 dark:text-gray-200">{children}</em>,
            a: ({children, href}) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              >
                {children}
              </a>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    );
  };

  if (!conversation || !agent) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select an Agent to Start
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose an AI agent from the sidebar to begin a conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${agent.color}`}>
            {agent.icon}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{agent.name}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{agent.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              data.length > 0 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {data.length > 0 ? `${data.length} rows loaded` : 'No data yet'}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.length === 0 && (
          <div className="text-center py-8">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4 ${agent.color}`}>
              {agent.icon}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Start a conversation with {agent.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {data.length > 0 
                ? `I can help you with ${agent.description.toLowerCase()}. What would you like me to do with your data?`
                : `I can help you with ${agent.description.toLowerCase()}. Feel free to ask questions about data processing, or upload your data first to get started with analysis.`
              }
            </p>
          </div>
        )}

        {conversation.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex space-x-3 max-w-3xl ${msg.type === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.type === "user" 
                  ? "bg-blue-600 text-white" 
                  : `${agent.color} text-white`
              }`}>
                {msg.type === "user" ? <User className="w-4 h-4" /> : agent.icon}
              </div>
              
              <div className={`rounded-lg p-4 ${
                msg.type === "user"
                  ? "bg-blue-600 text-white"
                  : msg.type === "system"
                  ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              }`}>
                {msg.type === "system" && (
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">System Error</span>
                  </div>
                )}
                
                {renderMessageContent(msg)}
                
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs ${
                    msg.type === "user" 
                      ? "text-blue-200" 
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {formatTimestamp(msg.timestamp)}
                  </span>
                  
                  {msg.type !== "user" && (
                    <button
                      onClick={() => copyToClipboard(msg.content)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-3 max-w-3xl">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${agent.color} text-white`}>
                {agent.icon}
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {data.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400">
              Upload data to start interacting with AI agents
            </p>
          </div>
        ) : (
          <div className="flex space-x-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask ${agent.name} about your data...`}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
