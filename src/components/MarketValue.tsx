"use client";

import { Card, CardContent } from "./ui/card";
import { SalaryRange } from "./ui/salary-range";
import type { SalaryEstimate } from "@/types";

interface MarketValueProps {
  salary: SalaryEstimate;
  title?: string;
  className?: string;
}

export function MarketValue({ salary, title, className }: MarketValueProps) {
  return (
    <Card className={`bg-white border-0 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden ${className || ""}`}>
      <CardContent className="pt-10 pb-10 px-8">
        <SalaryRange
          label="Your Market Value"
          min={salary.min}
          max={salary.max}
          targetMin={
            salary.min +
            ((salary.max - salary.min) * salary.percentile.low) / 100
          }
          targetMax={
            salary.min +
            ((salary.max - salary.min) * salary.percentile.high) / 100
          }
          location={`${title ? title + " · " : ""}${salary.location}`}
          percentile={salary.percentile}
        />
      </CardContent>
    </Card>
  );
}
