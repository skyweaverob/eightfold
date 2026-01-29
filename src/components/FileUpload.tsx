"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(".pdf")) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const clearFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedFile(null);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-14 transition-all duration-300",
          dragActive
            ? "border-blue-500 bg-blue-50 scale-[1.02]"
            : "border-gray-200 hover:border-blue-400 hover:bg-gray-50/50",
          selectedFile && "border-green-400 bg-green-50",
          isLoading && "pointer-events-none opacity-60"
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

        <div className="flex flex-col items-center justify-center space-y-5 text-center">
          {selectedFile ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center shadow-lg shadow-green-200/50">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 tracking-tight">
                  {selectedFile.name}
                </p>
                <p className="text-base text-gray-500 mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {!isLoading && (
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-500" />
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 tracking-tight">
                  Drop your resume here
                </p>
                <p className="text-base text-gray-500 mt-2">
                  or click to browse
                </p>
              </div>
              <p className="text-sm text-gray-400 font-medium">
                PDF only
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
