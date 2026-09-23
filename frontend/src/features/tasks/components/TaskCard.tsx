import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/features/tasks/types";
import { StepList } from "./StepList";

type TaskCardProps = {
  task: Task;
  onStepToggle: (taskId: string, stepId: string) => void;
  onTaskComplete: (taskId: string) => void;
  onRefresh: () => void;
  completed?: boolean;
};

export function TaskCard({
  task,
  onStepToggle,
  onTaskComplete,
  onRefresh,
  completed,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(true);

  const totalSteps = task.steps.length;
  const completedSteps = task.steps.filter((step) => step.completed).length;

  return (
    <article
      className={cn(
        "rounded-xl border bg-white transition-all",
        completed
          ? "border-tasks-calm bg-slate-50 opacity-50"
          : "border-tasks-border shadow-sm hover:shadow-md",
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 text-slate-500 hover:text-slate-700"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "text-sm font-medium text-slate-800",
              completed && "line-through text-slate-400",
            )}
          >
            {task.title}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            <span>
              {completedSteps}/{totalSteps} steps
            </span>
          </div>
        </div>

        {!completed && (
          <button
            onClick={() => onTaskComplete(task.id)}
            className="flex-shrink-0 rounded-lg bg-tasks-success px-3 py-1 text-xs font-medium text-white hover:brightness-110"
          >
            Done
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-tasks-border px-4 pb-4 pt-2">
          <StepList
            steps={task.steps}
            taskId={task.id}
            onStepToggle={onStepToggle}
          />
          <button
            onClick={onRefresh}
            className="mt-3 text-xs text-tasks-accent hover:underline"
          >
            Refresh steps
          </button>
        </div>
      )}
    </article>
  );
}
