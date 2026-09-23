import type { Task } from "@/features/tasks/types";
import { TaskCard } from "./TaskCard";

type TaskListProps = {
  tasks: Task[];
  onStepToggle: (taskId: string, stepId: string) => void;
  onTaskComplete: (taskId: string) => void;
  onRefresh: () => void;
};

export function TaskList({ tasks, onStepToggle, onTaskComplete, onRefresh }: TaskListProps) {
  const activeTasks = tasks.filter((task) => task.status !== "completed");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  return (
    <div className="space-y-3">
      {activeTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onStepToggle={onStepToggle}
          onTaskComplete={onTaskComplete}
          onRefresh={onRefresh}
        />
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
