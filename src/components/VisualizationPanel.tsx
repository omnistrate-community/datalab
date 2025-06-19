"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from "recharts";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Activity } from "lucide-react";
import { DataRow } from "@/types";

interface VisualizationPanelProps {
  data: DataRow[];
  columns: string[];
}

type ChartType = "bar" | "line" | "pie" | "scatter";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function VisualizationPanel({ data, columns }: VisualizationPanelProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [xAxis, setXAxis] = useState<string>("");
  const [yAxis, setYAxis] = useState<string>("");

  const numericColumns = useMemo(() => 
    columns.filter(col => 
      data.some(row => {
        const value = row[col];
        return value != null && !isNaN(parseFloat(String(value))) && isFinite(Number(value));
      })
    ), [data, columns]
  );

  const categoricalColumns = useMemo(() =>
    columns.filter(col => 
      !numericColumns.includes(col) && 
      data.some(row => row[col] && row[col].toString().trim() !== "")
    ), [data, columns, numericColumns]
  );

  const processedData = useMemo(() => {
    if (!xAxis || !data.length) return [];

    if (chartType === "pie") {
      // For pie charts, count occurrences of each category
      const counts: { [key: string]: number } = {};
      data.forEach(row => {
        const value = row[xAxis]?.toString() || "Unknown";
        counts[value] = (counts[value] || 0) + 1;
      });
      
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .slice(0, 10); // Limit to top 10 for readability
    }

    if (chartType === "scatter" && yAxis) {
      return data
        .filter(row => {
          const xVal = row[xAxis];
          const yVal = row[yAxis];
          return xVal != null && yVal != null && 
                 !isNaN(parseFloat(String(xVal))) && 
                 !isNaN(parseFloat(String(yVal)));
        })
        .map(row => ({
          x: parseFloat(String(row[xAxis])),
          y: parseFloat(String(row[yAxis])),
        }))
        .slice(0, 1000); // Limit points for performance
    }

    // For bar and line charts
    if (numericColumns.includes(xAxis) && yAxis && numericColumns.includes(yAxis)) {
      // Both axes are numeric - aggregate data
      const grouped: { [key: string]: number[] } = {};
      data.forEach(row => {
        const xVal = row[xAxis];
        const yVal = row[yAxis];
        if (xVal != null && yVal != null) {
          const xNumeric = parseFloat(String(xVal));
          const yNumeric = parseFloat(String(yVal));
          if (!isNaN(xNumeric) && !isNaN(yNumeric)) {
            const xGroup = Math.floor(xNumeric / 10) * 10; // Group by tens
            if (!grouped[xGroup]) grouped[xGroup] = [];
            grouped[xGroup].push(yNumeric);
          }
        }
      });

      return Object.entries(grouped)
        .map(([x, values]) => ({
          [xAxis]: x,
          [yAxis]: values.reduce((sum, val) => sum + val, 0) / values.length,
        }))
        .sort((a, b) => parseFloat(String(a[xAxis])) - parseFloat(String(b[xAxis])));
    }

    if (categoricalColumns.includes(xAxis) && yAxis && numericColumns.includes(yAxis)) {
      // X is categorical, Y is numeric
      const grouped: { [key: string]: number[] } = {};
      data.forEach(row => {
        const xVal = row[xAxis]?.toString() || "Unknown";
        const yVal = row[yAxis];
        if (yVal != null) {
          const yNumeric = parseFloat(String(yVal));
          if (!isNaN(yNumeric)) {
            if (!grouped[xVal]) grouped[xVal] = [];
            grouped[xVal].push(yNumeric);
          }
        }
      });

      return Object.entries(grouped)
        .map(([x, values]) => ({
          [xAxis]: x,
          [yAxis]: values.reduce((sum, val) => sum + val, 0) / values.length,
        }))
        .slice(0, 20); // Limit categories
    }

    return [];
  }, [data, xAxis, yAxis, chartType, numericColumns, categoricalColumns]);

  const chartOptions = [
    { type: "bar" as ChartType, label: "Bar Chart", icon: BarChart3 },
    { type: "line" as ChartType, label: "Line Chart", icon: LineChartIcon },
    { type: "pie" as ChartType, label: "Pie Chart", icon: PieChartIcon },
    { type: "scatter" as ChartType, label: "Scatter Plot", icon: Activity },
  ];

  if (!data.length || !columns.length) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Upload and process data to create visualizations.
        </p>
      </div>
    );
  }

  const renderChart = () => {
    if (!processedData.length) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          Select axes to generate visualization
        </div>
      );
    }

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={yAxis} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={yAxis} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={processedData}>
              <CartesianGrid />
              <XAxis type="number" dataKey="x" name={xAxis} />
              <YAxis type="number" dataKey="y" name={yAxis} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Data Visualization
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Create interactive charts and graphs from your data
        </p>
      </div>

      {/* Chart Type Selection */}
      <div className="flex flex-wrap gap-2">
        {chartOptions.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              chartType === type
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Axis Selection */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {chartType === "pie" ? "Category Column" : "X-Axis"}
          </label>
          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Select column...</option>
            {(chartType === "pie" ? categoricalColumns : columns).map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        {chartType !== "pie" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Y-Axis
            </label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Select column...</option>
              {(chartType === "scatter" ? columns : numericColumns).map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chart Display */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        {renderChart()}
      </div>

      {processedData.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {processedData.length} data points
        </div>
      )}
    </div>
  );
}
