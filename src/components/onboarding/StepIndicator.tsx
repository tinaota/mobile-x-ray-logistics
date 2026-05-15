import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <nav aria-label="Onboarding progress" className={cn("flex items-start gap-0", className)}>
      {steps.map((step, i) => {
        const status = i < currentStep ? "complete" : i === currentStep ? "current" : "upcoming";
        const isLast = i === steps.length - 1;

        return (
          <div key={step.label} className="flex flex-1 items-start min-w-0">
            {/* Step circle + connector */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full border-2 text-sm font-bold shrink-0 transition-colors",
                  status === "complete"
                    ? "bg-medical-blue border-medical-blue text-white"
                    : status === "current"
                    ? "bg-white border-medical-blue text-medical-blue"
                    : "bg-white border-outline-variant text-outline"
                )}
                aria-current={status === "current" ? "step" : undefined}
              >
                {status === "complete" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 h-full min-h-[2rem] mt-1",
                    i < currentStep ? "bg-medical-blue" : "bg-outline-variant"
                  )}
                />
              )}
            </div>

            {/* Step label */}
            <div className="ml-3 pb-6 min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold",
                  status === "current" ? "text-medical-blue" : status === "complete" ? "text-on-surface" : "text-outline"
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-on-surface-variant mt-0.5">{step.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
