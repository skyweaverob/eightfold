"use client";

import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isPending = stepNumber > currentStep;

          return (
            <div key={index} className="flex flex-col items-center flex-1">
              {/* Connector line */}
              {index > 0 && (
                <div
                  className={cn(
                    "absolute h-0.5 -translate-y-4",
                    isComplete || isCurrent
                      ? "bg-[var(--accent)]"
                      : "bg-[var(--surface)]"
                  )}
                  style={{
                    left: `${((index - 0.5) / steps.length) * 100}%`,
                    width: `${(1 / steps.length) * 100}%`,
                  }}
                />
              )}

              {/* Step circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium transition-all duration-200",
                  isComplete && "bg-[var(--success)] text-white",
                  isCurrent && "bg-[var(--accent)] text-white",
                  isPending && "bg-[var(--surface)] text-[var(--text-tertiary)]"
                )}
              >
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  stepNumber
                )}
              </div>

              {/* Step label */}
              <span
                className={cn(
                  "text-caption mt-1.5 text-center hidden sm:block",
                  isCurrent
                    ? "text-[var(--text-primary)] font-medium"
                    : "text-[var(--text-tertiary)]"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
