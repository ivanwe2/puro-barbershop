"use client";

import { cn } from "@/lib/utils";

interface StepperProps {
  currentStep: number;
  steps: string[];
}

export default function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        const isUpcoming = stepNum > currentStep;

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                  isCompleted && "bg-accent text-accent-foreground",
                  isCurrent && "border-accent text-accent border-2 bg-transparent",
                  isUpcoming &&
                    "border-muted-foreground/30 text-muted-foreground/50 border-2 bg-transparent",
                )}
              >
                {isCompleted ? "✓" : stepNum}
              </div>
              <span
                className={cn(
                  "hidden text-[10px] font-medium sm:block",
                  isCurrent && "text-accent",
                  isCompleted && "text-accent/70",
                  isUpcoming && "text-muted-foreground/50",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-px w-8 sm:mx-2 sm:w-12",
                  isCompleted && "bg-accent",
                  isUpcoming && "bg-muted-foreground/30",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
