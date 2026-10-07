import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { Task, TaskStep } from "@/features/tasks/types";

// 局部微步错误，携带出错的任务ID与微步ID，供TaskCard在对应位置渲染可重试提示
export type StepError = {
  taskId: string;
  stepId: string;
  message: string;
};

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  stepError: StepError | null;
  fetchTasks: () => Promise<void>;
  createTask: (title: string) => Promise<void>;
  toggleStep: (taskId: string, stepId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<StepError | null>(null);

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
    setStepError(null);
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

  // 切换微步完成状态：乐观更新本地状态，失败时记录局部错误
  const toggleStep = useCallback(
    async (taskId: string, stepId: string) => {
      setStepError(null);

      let targetCompleted = false;
      let originalCompleted = false;

      // 在函数式更新内部查找当前状态，确保拿到最新队列快照，不依赖外部闭包变量
      setTasks((prev) => {
        const currentTask = prev.find((t) => t.id === taskId);
        const currentStep = currentTask?.steps.find((s) => s.id === stepId);

        originalCompleted = currentStep?.completed ?? false;
        targetCompleted = !originalCompleted;

        // 乐观更新：立即反转微步状态，进度条即时响应
        return prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                steps: task.steps.map((step) =>
                  step.id === stepId ? { ...step, completed: targetCompleted } : step
                ),
              }
            : task
        );
      });

      try {
        await apiFetch(`/tasks/${taskId}/steps/${stepId}`, {
          method: "PATCH",
          body: JSON.stringify({ completed: targetCompleted }),
        });
      } catch {
        // 失败时回滚到操作前的状态
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  steps: task.steps.map((step) =>
                    step.id === stepId ? { ...step, completed: originalCompleted } : step
                  ),
                }
              : task
          )
        );
        setStepError({ taskId, stepId, message: "更新失败" });
      }
    },
    [] // 无依赖：函数式更新内部自己处理最新状态，无需将 tasks 纳入依赖数组
  );

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
    stepError,
    fetchTasks,
    createTask,
    toggleStep,
    completeTask,
  };
}