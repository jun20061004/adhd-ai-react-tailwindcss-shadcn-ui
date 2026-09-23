import { useState, useEffect, useCallback } from "react";
import { TaskInput } from "@/features/tasks/components/TaskInput";
import { TaskList } from "@/features/tasks/components/TaskList";
import { apiFetch } from "@/lib/api";
import type { Task } from "@/features/tasks/types";

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // 新增全局错误状态以防止无反馈白屏
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 假定apiFetch底层已封装API前缀。若无，请手动修正为/api/v1/tasks
      const response = await apiFetch<any>("/tasks");
      // 增加数据结构兼容处理：尝试提取嵌套在对象中的数组数据
      // 全局作用：防止后端数据结构使用对象包裹(如FastAPI返回{"data":[...]})导致前端状态类型断裂
      const tasksData = Array.isArray(response)
        ? response
        : response.data || response.tasks || response.items || [];

      setTasks(tasksData);
    } catch (err: any) {
      console.error("加载Task列表失败:", err);
      setError("无法加载任务数据，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const handleCreate = async (title: string) => {
    setSubmitting(true);
    try {
      const task = await apiFetch<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      setTasks((prev) => [task, ...prev]);
    } catch (err: any) {
      console.error("创建Task失败:", err);
      alert("创建失败，请检查网络并重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepToggle = async (taskId: string, stepId: string) => {
    try {
      // 补全缺失的业务逻辑：向后端发送具体的Step状态更新指令
      await apiFetch<Task>(`/tasks/${taskId}/steps/${stepId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "toggled" }),
      });
      // Refresh after step completion for visual feedback
      await loadTasks();
    } catch (err: any) {
      console.error("更新Step状态失败:", err);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      await apiFetch<Task>(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      });
      await loadTasks();
    } catch (err: any) {
      console.error("完成Task状态更新失败:", err);
    }
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

        <TaskInput onSubmit={handleCreate} submitting={submitting} />

        <main className="mt-6 space-y-3">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Loading tasks...
            </div>
          ) :!Array.isArray(tasks) || tasks.length === 0 && !error ? (
            <div className="rounded-xl border border-dashed border-tasks-border bg-white p-8 text-center">
              <p className="text-sm text-slate-400">
                No tasks yet. Add one above to get started.
              </p>
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              onStepToggle={handleStepToggle}
              onTaskComplete={handleTaskComplete}
              onRefresh={loadTasks}
            />
          )}
        </main>
      </div>
    </div>
  );
}