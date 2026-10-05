import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskStep } from "@/features/tasks/types";

type StepListProps = {
  steps: TaskStep[];
  taskId: string;
  onStepToggle: (taskId: string, stepId: string) => void;
};

export function StepList({ steps, taskId, onStepToggle }: StepListProps) {
  return (
    <ul className="space-y-2">
      {steps.map((step) => (
        <li
          key={step.id}
          className={cn(
            "flex items-start gap-3 rounded-lg p-2 transition-colors",
            step.completed && "bg-slate-100",
          )}
        >
          {/* step.id 来源自后端落库后的主键，与 TaskStep.id 保持一致 */}
          <button
              onClick={() => onStepToggle(taskId, step.id)}
              className="mt-0.5 flex-shrink-0"
          >
            {step.completed ? (
              <CheckCircle2 className="h-4 w-4 text-tasks-success" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-slate-300" />
            )}
          </button>
          <div className="flex-1">
            <p
              className={cn(
                "text-sm",
                step.completed
                  ? "line-through text-slate-400"
                  : "text-slate-700",
              )}
            >
              {step.description}
            </p>
            <span className="mt-0.5 text-xs text-slate-400">
              ~{step.estimated_minutes} min
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
