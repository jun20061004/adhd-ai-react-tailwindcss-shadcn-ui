export interface TaskStep {
  id: string;
  description: string;
  estimated_minutes: number;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  steps: TaskStep[];
  created_at: string;
  updated_at: string;
}

// export interface CreateTaskRequest {
//   title: string;
// }

// export interface CreateTaskResponse {
//   task: Task;
//   steps_generated: number;
// }
