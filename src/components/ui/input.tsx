"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[var(--radius-md)] border bg-background px-3 py-2 text-[15px]",
          "placeholder:text-[var(--text-tertiary)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-200",
          error
            ? "border-[var(--error)] focus:ring-[var(--error)]"
            : "border-[var(--border-light)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
