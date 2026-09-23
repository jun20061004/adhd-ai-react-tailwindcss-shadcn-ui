# ADHD AI Task Manager - Backend

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Or using uv:
```powershell
uv sync
uv run uvicorn app.main:app --reload
```

## Endpoints

- GET /api/v1/health - Health check
- GET /api/v1/tasks - List all tasks
- POST /api/v1/tasks - Create task with AI decomposition
- PATCH /api/v1/tasks/{task_id} - Update task status
- DELETE /api/v1/tasks/{task_id} - Delete task
