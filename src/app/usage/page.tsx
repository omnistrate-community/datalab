"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  Cpu, 
  HardDrive, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Calendar,
  DollarSign,
  Activity,
  Server,
  CreditCard
} from "lucide-react";
import BillingPage from "@/components/BillingPage";

// Mock data for infrastructure usage
const mockInfrastructureUsage = {
  cores: {
    current: 4,
    peak: 8,
    average: 3.2,
    limit: 16,
    unit: "cores",
    cost: 0.12 // per core per hour
  },
  memory: {
    current: 12.5,
    peak: 24.8,
    average: 8.7,
    limit: 32,
    unit: "GB",
    cost: 0.08 // per GB per hour
  },
  storage: {
    current: 150,
    peak: 180,
    average: 135,
    limit: 500,
    unit: "GB",
    cost: 0.02 // per GB per month
  },
  bandwidth: {
    current: 2.3,
    peak: 5.1,
    average: 1.8,
    limit: 100,
    unit: "GB/day",
    cost: 0.05 // per GB
  }
};

// Mock data for application usage
interface ApplicationUsageItem {
  value: number;
  limit: number;
  unit: string;
  cost: number;
  trend: string;
}

const mockApplicationUsage: Record<string, ApplicationUsageItem> = {
  documents: {
    value: 1247,
    limit: 5000,
    unit: "documents",
    cost: 0.001, // per document
    trend: "+12%"
  },
  agents: {
    value: 3456,
    limit: 10000,
    unit: "interactions",
    cost: 0.002, // per interaction
    trend: "+8%"
  },
  dataRows: {
    value: 2847293,
    limit: 10000000,
    unit: "rows",
    cost: 0.000001, // per row
    trend: "+15%"
  },
  llmCalls: {
    value: 2789,
    limit: 8000,
    unit: "API calls",
    cost: 0.01, // per call
    trend: "+5%"
  }
};

// Mock billing data
const mockBilling = {
  currentPeriod: {
    start: "2025-06-01",
    end: "2025-06-30",
    daysRemaining: 11
  },
  currentCosts: {
    infrastructure: 234.56,
    application: 67.89,
    total: 302.45
  },
  projectedCosts: {
    infrastructure: 421.20,
    application: 121.78,
    total: 542.98
  },
  previousPeriod: {
    infrastructure: 198.32,
    application: 45.67,
    total: 243.99
  }
};

const mockTimeSeriesData = [
  { date: "2025-06-01", infrastructure: 12.45, application: 3.21, total: 15.66 },
  { date: "2025-06-02", infrastructure: 14.32, application: 4.15, total: 18.47 },
  { date: "2025-06-03", infrastructure: 11.89, application: 2.98, total: 14.87 },
  { date: "2025-06-04", infrastructure: 16.78, application: 5.43, total: 22.21 },
  { date: "2025-06-05", infrastructure: 13.56, application: 3.87, total: 17.43 },
  { date: "2025-06-06", infrastructure: 15.23, application: 4.56, total: 19.79 },
  { date: "2025-06-07", infrastructure: 12.91, application: 3.34, total: 16.25 },
];

export default function UsagePage() {
  const [usageType, setUsageType] = useState<"infrastructure" | "application">("infrastructure");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [activeTab, setActiveTab] = useState<"usage" | "billing">("usage");

  useEffect(() => {
    // Simulate reading environment variable
    // In a real app, this would be set server-side and passed as a prop
    const envUsageType = process.env.NEXT_PUBLIC_USAGE_TYPE || "infrastructure";
    setUsageType(envUsageType as "infrastructure" | "application");
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const renderInfrastructureUsage = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(mockInfrastructureUsage).map(([key, data]) => {
          const percentage = getUsagePercentage(data.current, data.limit);
          const isHigh = percentage > 80;
          const isMedium = percentage > 60;
          
          return (
            <div key={key} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {key === 'cores' && <Cpu className="w-5 h-5 text-blue-600" />}
                  {key === 'memory' && <HardDrive className="w-5 h-5 text-green-600" />}
                  {key === 'storage' && <Server className="w-5 h-5 text-purple-600" />}
                  {key === 'bandwidth' && <Activity className="w-5 h-5 text-orange-600" />}
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {key}
                  </h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isHigh ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  isMedium ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {percentage.toFixed(1)}%
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Current</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {data.current} {data.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      isHigh ? 'bg-red-500' : isMedium ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Peak: {data.peak} {data.unit}</span>
                  <span>Limit: {data.limit} {data.unit}</span>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Cost</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(data.current * data.cost)}/hr
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderApplicationUsage = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(mockApplicationUsage).map(([key, data]) => {
          const percentage = getUsagePercentage(data.value, data.limit);
          const isHigh = percentage > 80;
          const isMedium = percentage > 60;
          const value = data.value;
          
          return (
            <div key={key} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {key === 'documents' && <FileText className="w-5 h-5 text-blue-600" />}
                  {key === 'agents' && <MessageSquare className="w-5 h-5 text-green-600" />}
                  {key === 'dataRows' && <BarChart3 className="w-5 h-5 text-purple-600" />}
                  {key === 'llmCalls' && <Activity className="w-5 h-5 text-orange-600" />}
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isHigh ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                    isMedium ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  }`}>
                    {percentage.toFixed(1)}%
                  </span>
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {data.trend}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Used</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatNumber(value)} {data.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      isHigh ? 'bg-red-500' : isMedium ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>This period</span>
                  <span>Limit: {formatNumber(data.limit)} {data.unit}</span>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Cost</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(value * data.cost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Usage & Billing
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Monitor your DataLab usage and costs
              </p>
            </div>
            {activeTab === "usage" && (
              <div className="flex items-center space-x-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as "24h" | "7d" | "30d")}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <button
                    onClick={() => setUsageType("infrastructure")}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      usageType === "infrastructure"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    Infrastructure
                  </button>
                  <button
                    onClick={() => setUsageType("application")}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      usageType === "application"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    Application
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("usage")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "usage"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Usage</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("billing")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "billing"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Billing</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "usage" ? (
          <>
            {/* Current Billing Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Current Period
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {usageType === "infrastructure" ? "Infrastructure" : "Application"}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(usageType === "infrastructure" ? mockBilling.currentCosts.infrastructure : mockBilling.currentCosts.application)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatCurrency(mockBilling.currentCosts.total)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {mockBilling.currentPeriod.daysRemaining} days remaining in billing period
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Projected
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">End of period</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(mockBilling.projectedCosts.total)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">vs. last period</span>
                    <span className="text-green-600 dark:text-green-400">
                      +{(((mockBilling.projectedCosts.total - mockBilling.previousPeriod.total) / mockBilling.previousPeriod.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Billing Period
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Start</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(mockBilling.currentPeriod.start).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">End</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(mockBilling.currentPeriod.end).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {usageType === "infrastructure" ? "Infrastructure Usage" : "Application Usage"}
              </h2>
              {usageType === "infrastructure" ? renderInfrastructureUsage() : renderApplicationUsage()}
            </div>

            {/* Daily Costs Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Daily Costs
              </h2>
              <div className="h-64 flex items-end space-x-2">
                {mockTimeSeriesData.map((day, index) => {
                  const maxValue = Math.max(...mockTimeSeriesData.map(d => d.total));
                  const height = (day.total / maxValue) * 100;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full relative">
                        <div 
                          className="w-full bg-blue-500 rounded-t"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                          title={`${day.date}: ${formatCurrency(day.total)}`}
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 transform -rotate-45 origin-center">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Hover over bars to see daily costs
                </div>
              </div>
            </div>
          </>
        ) : (
          <BillingPage />
        )}
    </div>
  );
}
