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
          "w-full flex items-center justify-between p-4 md:p-6 text-left transition-colors hover:bg-gray-50",
          headerClassName
        )}
      >
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          {icon && (
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 [&>div]:w-8 [&>div]:h-8 md:[&>div]:w-10 md:[&>div]:h-10 [&_svg]:w-4 [&_svg]:h-4 md:[&_svg]:w-5 md:[&_svg]:h-5">
              {icon}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
            <h3 className="text-base md:text-xl font-semibold text-gray-900 tracking-tight">{title}</h3>
            {badge && <div className="flex-shrink-0">{badge}</div>}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 md:w-5 md:h-5 text-gray-400 transition-transform duration-300 ease-out flex-shrink-0 ml-2",
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
        <div className="px-4 md:px-6 pb-4 md:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
