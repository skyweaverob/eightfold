"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  accept?: string;
}

export function FileUpload({
  onFileSelect,
  isLoading = false,
  accept = ".pdf",
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.name.toLowerCase().endsWith(".pdf")) {
          setSelectedFile(file);
        }
      }
    },
    []
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  }, [selectedFile, onFileSelect]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-colors",
          dragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-gray-300 dark:border-gray-700",
          selectedFile && "border-green-500 bg-green-50 dark:bg-green-950"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {selectedFile ? (
            <>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {!isLoading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Upload className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Drop your resume here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  or click to browse (PDF only)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            size="lg"
            className="w-full max-w-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze My Profile"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
