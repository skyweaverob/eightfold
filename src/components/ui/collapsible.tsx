"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  badge?: React.ReactNode;
}

export function Collapsible({
  title,
  icon,
  defaultOpen = false,
  children,
  className,
  headerClassName,
  badge,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    if (isOpen) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight);
      // After animation, set to auto for dynamic content
      const timer = setTimeout(() => setHeight(undefined), 300);
      return () => clearTimeout(timer);
    } else {
      // First set to current height, then to 0 for animation
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHeight(0);
        });
      });
    }
  }, [isOpen]);

  return (
    <div className={cn("bg-white border-0 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-gray-50",
          headerClassName
        )}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
              {icon}
            </div>
          )}
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-gray-900 tracking-tight">{title}</h3>
            {badge}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-gray-400 transition-transform duration-300 ease-out",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        ref={contentRef}
        style={{ height: height !== undefined ? `${height}px` : "auto" }}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          !isOpen && "opacity-0",
          isOpen && "opacity-100"
        )}
      >
        <div className="px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
