import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";

type TaskInputProps = {
  onSubmit: (title: string) => Promise<void>;
  submitting: boolean;
};

export function TaskInput({ onSubmit, submitting }: TaskInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = value.trim();
    if (!title) {
      return;
    }

    await onSubmit(title);
    setValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const form = event.currentTarget.form;
      form?.requestSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-tasks-border bg-white p-4">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Add a task in one sentence
      </label>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What do you need to do next?"
        rows={2}
        className="w-full rounded-lg border border-tasks-border bg-slate-50 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-tasks-accent focus:outline-none focus:ring-2 focus:ring-tasks-accent/30"
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">Press Enter to submit quickly</span>
        <button
          type="submit"
          disabled={submitting || !value.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-tasks-accent px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Add task
        </button>
      </div>
    </form>
  );
}
