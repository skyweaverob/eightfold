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
    <div className="w-full max-w-md mx-auto">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-[var(--radius-lg)] p-12 transition-all duration-200",
          dragActive
            ? "border-[var(--accent)] bg-[var(--accent-light)]"
            : "border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface)]",
          selectedFile && "border-[var(--success)] bg-[var(--success-light)]",
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

        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {selectedFile ? (
            <>
              <div className="w-12 h-12 rounded-full bg-[var(--success)] bg-opacity-10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-headline text-[var(--text-primary)]">
                  {selectedFile.name}
                </p>
                <p className="text-footnote text-[var(--text-secondary)] mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {!isLoading && (
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[var(--surface)] transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
              )}
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center">
                <Upload className="w-6 h-6 text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="text-headline text-[var(--text-primary)]">
                  Drop your resume here
                </p>
                <p className="text-footnote text-[var(--text-secondary)] mt-1">
                  or click to browse
                </p>
              </div>
              <p className="text-caption text-[var(--text-tertiary)]">
                PDF only
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
