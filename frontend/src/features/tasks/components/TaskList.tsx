import type { Task } from "@/features/tasks/types";
import type { StepError } from "@/features/tasks/hooks/useTasks";
import { TaskCard } from "./TaskCard";

type TaskListProps = {
  tasks: Task[];
  onStepToggle: (taskId: string, stepId: string) => void;
  onTaskComplete: (taskId: string) => void;
  onRefresh: () => void;
  onDelete?: (taskId: string) => void;
  stepError?: StepError | null;
  submitting?: boolean;
};

export function TaskList({
  tasks,
  onStepToggle,
  onTaskComplete,
  onRefresh,
  onDelete,
  stepError,
  submitting,
}: TaskListProps) {
  const activeTasks = tasks.filter((task) => task.status !== "completed");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  // 骨架屏任务占位：在提交新建任务期间，AI拆解尚未完成，新任务还未加入 tasks 数组。
  // 此时在列表最顶部渲染一个静态骨架卡片，避免用户看到空白的等待体验，
  // 明确告知任务正在被拆解中。
  const renderSubmittingSkeleton = () => (
    <div className="rounded-xl border border-dashed border-tasks-border bg-slate-50 p-4 opacity-60">
      {/* 标题占位条 */}
      <div className="mb-3 h-3 w-3/4 animate-pulse rounded bg-slate-200" />
      {/* 微步骨架占位条（模拟 3-5 个微步） */}
      <div className="space-y-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="h-4 w-4 flex-shrink-0 animate-pulse rounded-full border border-slate-200 bg-slate-100" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-2 w-12 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* 正在拆解的新任务骨架占位，始终渲染在列表最顶部，增加条件判断 */}
      {submitting && renderSubmittingSkeleton()}

      {activeTasks.map((task) => (
        <div key={task.id} className="group">
          {/* group class 用于实现删除按钮的 hover 显示效果 */}
          <TaskCard
            task={task}
            onStepToggle={onStepToggle}
            onTaskComplete={onTaskComplete}
            onRefresh={onRefresh}
            onDelete={onDelete}
            stepError={stepError}
          />
        </div>
      ))}

      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Completed
          </h2>
          {completedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStepToggle={onStepToggle}
              onTaskComplete={onTaskComplete}
              onRefresh={onRefresh}
              completed
              stepError={stepError}
            />
          ))}
        </div>
      )}
    </div>
  );
}