"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-sm)] px-2.5 py-0.5 text-[13px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--surface)] text-[var(--text-primary)]",
        accent: "bg-[var(--accent-light)] text-[var(--accent)]",
        success: "bg-[var(--success-light)] text-[#1D7A3E]",
        warning: "bg-[var(--warning-light)] text-[#996300]",
        error: "bg-[var(--error-light)] text-[#CC2F26]",
        muted: "bg-[var(--surface)] text-[var(--text-secondary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
