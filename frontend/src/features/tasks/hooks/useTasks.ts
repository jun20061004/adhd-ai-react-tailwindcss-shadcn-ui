import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { Task } from "@/features/tasks/types";

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (title: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 读取任务列表：AI拆解完成后通过此接口回刷
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<any>("/tasks");

      // 兼容后端 TaskListResponse 的 tasks 字段，以及 apiFetch 可能包裹的 data 字段
      const taskList = response.tasks || response.data?.tasks || response.data || response;

      // 只有在确认是数组时才赋值，否则退化为空数组避免崩溃
      setTasks(Array.isArray(taskList) ? taskList : []);
    } catch {
      setError("无法加载任务数据");
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建任务：调用AI拆解接口，返回完整TaskResponse
  const createTask = useCallback(async (title: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch<any>("/ai/decompose", {
      method: "POST",
      body: JSON.stringify({ title }),
        });
      const newTask = response.data || response;
      setTasks((prev) => [newTask, ...prev]);
    } catch {
      setError("任务拆解失败");
    } finally {
      setSubmitting(false);
    }
  }, []);

  // 标记任务为完成
  const completeTask = useCallback(async (taskId: string) => {
    try {
      const updated = await apiFetch<Task>(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      });
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updated : task))
      );
    } catch {
      setError("状态更新失败");
    }
  }, []);

  return {
    tasks,
    loading,
    submitting,
    error,
    fetchTasks,
    createTask,
    completeTask,
  };
}