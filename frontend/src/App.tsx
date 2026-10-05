import { useEffect } from "react";
import { TaskInput } from "@/features/tasks/components/TaskInput";
import { TaskList } from "@/features/tasks/components/TaskList";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { apiFetch } from "@/lib/api";

export function App() {
  const {
    tasks,
    loading,
    submitting,
    error,
    fetchTasks,
    createTask,
    completeTask,
  } = useTasks();

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const handleStepToggle = async (taskId: string, stepId: string) => {
    await apiFetch(`/tasks/${taskId}/steps/${stepId}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: true }),
    });
    await fetchTasks();
  };

  return (
    <div className="min-h-screen bg-tasks-bg">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800">
            ADHD AI Task Manager
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            One input. AI decomposes into micro-steps.
          </p>
        </header>

        <TaskInput onSubmit={createTask} submitting={submitting} />

        <main className="mt-6 space-y-3">
          {error && (
            <div className="rounded-xl border border-tasks-warning-bg bg-tasks-warning-bg p-4 text-center text-sm text-slate-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Loading tasks...
            </div>
          ) : tasks.length === 0 && !error ? (
            <div className="rounded-xl border border-dashed border-tasks-border bg-white p-8 text-center">
              <p className="text-sm text-slate-400">
                No tasks yet. Add one above to get started.
              </p>
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              onStepToggle={handleStepToggle}
              onTaskComplete={completeTask}
              onRefresh={fetchTasks}
            />
          )}
        </main>
      </div>
    </div>
  );
}