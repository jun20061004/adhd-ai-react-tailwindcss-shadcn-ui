import type { TaskStep } from "@/features/tasks/types";

type StepDetailProps = {
  step: TaskStep;
};

export function StepDetail({ step }: StepDetailProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-4 w-4 rounded-full border border-slate-300" />
      <span className="text-sm text-slate-700">{step.description}</span>
      <span className="text-xs text-slate-400">
        ~{step.estimated_minutes} min
      </span>
    </div>
  );
}
