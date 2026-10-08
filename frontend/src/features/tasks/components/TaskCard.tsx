import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/features/tasks/types";
import type { StepError } from "@/features/tasks/hooks/useTasks";
import { StepList } from "./StepList";

type TaskCardProps = {
  task: Task;
  onStepToggle: (taskId: string, stepId: string) => void;
  onTaskComplete: (taskId: string) => void;
  onRefresh: () => void;
  onDelete?: (taskId: string) => void;
  completed?: boolean;
  // 控制展开后微步区域是否显示骨架屏占位
  loadingSteps?: boolean;
  stepError?: StepError | null;
};

export function TaskCard({
  task,
  onStepToggle,
  onTaskComplete,
  onRefresh,
  onDelete,
  completed,
  loadingSteps,
  stepError,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(true);

  const totalSteps = task.steps.length;
  const completedSteps = task.steps.filter((step) => step.completed).length;

  // 仅当错误属于本任务时渲染重试提示
  const localStepError =
    stepError && stepError.taskId === task.id ? stepError : null;

  const renderSkeleton = () => (
    <div className="space-y-2" aria-busy="true" aria-label="Loading steps">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg p-2"
        >
          <div className="h-4 w-4 flex-shrink-0 animate-pulse rounded-full border border-slate-200 bg-slate-100" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-2 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );

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
          aria-expanded={expanded}
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
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 删除按钮：仅非完成态任务显示，使用低对比度浅灰色，hover 时略微加深 */}
            {onDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Delete task"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => onTaskComplete(task.id)}
              className="flex-shrink-0 rounded-lg bg-tasks-success px-3 py-1 text-xs font-medium text-white hover:brightness-110"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-tasks-border px-4 pb-4 pt-2">
          {loadingSteps ? (
            renderSkeleton()
          ) : (
            <>
              <StepList
                steps={task.steps}
                taskId={task.id}
                onStepToggle={onStepToggle}
                stepError={localStepError}
              />
              <button
                onClick={onRefresh}
                className="mt-3 text-xs text-tasks-accent hover:underline"
              >
                Refresh steps
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
}