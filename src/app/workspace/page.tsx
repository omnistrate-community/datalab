"use client";

import { useState } from "react";
import { Upload, FileText, BarChart3 } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import DataTable from "@/components/DataTable";
import AgentPanel from "@/components/AgentPanelNew";
import VisualizationPanel from "@/components/VisualizationPanel";
import { DataRow } from "@/types";

export default function Workspace() {
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"upload" | "data" | "agents" | "visualize">("upload");

  const handleDataLoad = (newData: DataRow[], newColumns: string[]) => {
    setData(newData);
    setColumns(newColumns);
    setActiveTab("data");
  };

  const tabs = [
    { id: "upload" as const, label: "Upload", icon: Upload },
    { id: "data" as const, label: "Data", icon: FileText },
    { id: "agents" as const, label: "AI Agents", icon: BarChart3 },
    { id: "visualize" as const, label: "Visualize", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                DataLab Workspace
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Upload, process, and visualize your data with AI-powered agents
              </p>
            </div>
              
              {/* Tab Navigation */}
              <div className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 pb-4 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTab === "upload" && (
                <FileUpload onDataLoad={handleDataLoad} />
              )}
              
              {activeTab === "data" && (
                <DataTable data={data} columns={columns} />
              )}
              
              {activeTab === "agents" && (
                <AgentPanel 
                  data={data} 
                  columns={columns} 
                  onDataUpdate={(newData: DataRow[]) => setData(newData)} 
                />
              )}
              
              {activeTab === "visualize" && (
                <VisualizationPanel data={data} columns={columns} />
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
