"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { DataRow } from "@/types";

interface FileUploadProps {
  onDataLoad: (data: DataRow[], columns: string[]) => void;
}

export default function FileUpload({ onDataLoad }: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    console.log("Processing file:", file.name, "Type:", file.type, "Size:", file.size);
    
    setIsLoading(true);
    setError(null);

    try {
      // Check if it's a CSV file (by extension or MIME type)
      const isCSV = file.name.toLowerCase().endsWith(".csv") || 
                   file.type === "text/csv" || 
                   file.type === "text/plain";
                   
      // Check if it's a JSON file
      const isJSON = file.name.toLowerCase().endsWith(".json") || 
                    file.type === "application/json";

      if (isCSV) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Only show error if there are critical errors that prevent parsing
            const criticalErrors = results.errors.filter(error => 
              error.type === "Delimiter" || error.type === "Quotes"
            );
            
            if (criticalErrors.length > 0) {
              console.error("CSV parsing errors:", results.errors);
              setError(`Error parsing CSV file: ${criticalErrors[0].message}`);
              setIsLoading(false);
              return;
            }
            
            // Log non-critical errors for debugging but continue processing
            if (results.errors.length > 0) {
              console.warn("CSV parsing warnings:", results.errors);
            }
            
            const data = results.data as DataRow[];
            const columns = results.meta.fields || [];
            
            // Filter out completely empty rows
            const cleanData = data.filter(row => 
              Object.values(row).some(value => value !== null && value !== undefined && value !== "")
            );
            
            if (cleanData.length === 0) {
              setError("CSV file appears to be empty or has no valid data");
              setIsLoading(false);
              return;
            }
            
            onDataLoad(cleanData, columns);
            setIsLoading(false);
          },
          error: (error) => {
            console.error("Papa Parse error:", error);
            setError(`Error reading file: ${error.message}`);
            setIsLoading(false);
          }
        });
      } else if (isJSON) {
        try {
          const text = await file.text();
          
          if (!text.trim()) {
            setError("JSON file is empty");
            setIsLoading(false);
            return;
          }
          
          const jsonData = JSON.parse(text);
          
          let data: DataRow[] = [];
          let columns: string[] = [];
          
          if (Array.isArray(jsonData)) {
            data = jsonData;
            if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
              // Get all unique keys from all objects
              const allKeys = new Set<string>();
              data.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                  Object.keys(item).forEach(key => allKeys.add(key));
                }
              });
              columns = Array.from(allKeys);
            }
          } else if (typeof jsonData === 'object' && jsonData !== null) {
            // Convert single object to array
            data = [jsonData];
            columns = Object.keys(jsonData);
          } else {
            setError("JSON file must contain an object or array of objects");
            setIsLoading(false);
            return;
          }
          
          if (data.length === 0) {
            setError("JSON file contains no valid data");
            setIsLoading(false);
            return;
          }
          
          onDataLoad(data, columns);
          setIsLoading(false);
        } catch (parseError) {
          console.error("JSON parsing error:", parseError);
          setError(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
          setIsLoading(false);
        }
      } else {
        console.log("Unsupported file type:", file.type, "Name:", file.name);
        setError(`Unsupported file type: ${file.name}. Please upload CSV or JSON files only.`);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("File processing error:", err);
      setError(`Error processing file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  }, [onDataLoad]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/plain': ['.csv'], // Some systems might detect CSV as text/plain
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB limit
  });

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        
        {isLoading ? (
          <div className="space-y-2">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-300">Processing file...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {isDragActive ? "Drop your file here" : "Upload your data file"}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Drag and drop a CSV or JSON file, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: .csv, .json
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
