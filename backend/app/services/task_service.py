from datetime import datetime
from sqlmodel import Session, select
from app.models.task import Task, TaskStep
from app.schemas.task import StepResponse, TaskResponse


def create_task_with_steps(
    session: Session,
    title: str,
    steps: list[StepResponse],
) -> TaskResponse:
    task = Task(title=title, status="pending")
    session.add(task)
    session.commit()
    session.refresh(task)

    for step_data in steps:
        task_step = TaskStep(
            task_id=task.id,
            description=step_data.description,
            estimated_minutes=step_data.estimated_minutes,
            completed=False,
        )
        session.add(task_step)

    session.commit()

    # 重新从数据库读取微步，确保响应中的 step.id 是真实落库后的主键，
    # 与前端后续调用 toggle_step 所需的 step_id 保持一致
    step_stmt = select(TaskStep).where(TaskStep.task_id == task.id)
    persisted_steps = session.exec(step_stmt).all()

    return TaskResponse(
        id=task.id,
        title=task.title,
        status=task.status,
        steps=[
            StepResponse(
                id=s.id,
                description=s.description,
                estimated_minutes=s.estimated_minutes,
                completed=s.completed,
            )
            for s in persisted_steps
        ],
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


def list_tasks(session: Session) -> list[TaskResponse]:
    statement = select(Task).order_by(Task.created_at.desc())
    tasks = session.exec(statement).all()

    result = []
    for task in tasks:
        step_stmt = select(TaskStep).where(TaskStep.task_id == task.id)
        task_steps = session.exec(step_stmt).all()
        result.append(
            TaskResponse(
                id=task.id,
                title=task.title,
                status=task.status,
                steps=[
                    StepResponse(
                        id=s.id,
                        description=s.description,
                        estimated_minutes=s.estimated_minutes,
                        completed=s.completed,
                    )
                    for s in task_steps
                ],
                created_at=task.created_at,
                updated_at=task.updated_at,
            )
        )

    return result


def update_task_status(
    session: Session,
    task_id: str,
    new_status: str,
) -> TaskResponse | None:
    task = session.get(Task, task_id)
    if task is None:
        return None

    task.status = new_status
    task.updated_at = datetime.utcnow()
    session.add(task)
    session.commit()
    session.refresh(task)

    step_stmt = select(TaskStep).where(TaskStep.task_id == task.id)
    task_steps = session.exec(step_stmt).all()

    return TaskResponse(
        id=task.id,
        title=task.title,
        status=task.status,
        steps=[
            StepResponse(
                id=s.id,
                description=s.description,
                estimated_minutes=s.estimated_minutes,
                completed=s.completed,
            )
            for s in task_steps
        ],
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


def toggle_step(
    session: Session,
    task_id: str,
    step_id: str,
) -> TaskResponse | None:
    step = session.get(TaskStep, step_id)
    if step is None or step.task_id != task_id:
        return None

    step.completed = not step.completed
    session.add(step)
    session.commit()

    task = session.get(Task, task_id)
    assert task is not None

    all_steps_stmt = select(TaskStep).where(TaskStep.task_id == task_id)
    all_steps = session.exec(all_steps_stmt).all()
    all_completed = all(s.completed for s in all_steps)

    if all_completed:
        task.status = "completed"
        task.updated_at = datetime.utcnow()
        session.add(task)
        session.commit()
        session.refresh(task)

    step_stmt = select(TaskStep).where(TaskStep.task_id == task.id)
    task_steps = session.exec(step_stmt).all()

    return TaskResponse(
        id=task.id,
        title=task.title,
        status=task.status,
        steps=[
            StepResponse(
                id=s.id,
                description=s.description,
                estimated_minutes=s.estimated_minutes,
                completed=s.completed,
            )
            for s in task_steps
        ],
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


def delete_task(session: Session, task_id: str) -> bool:
    task = session.get(Task, task_id)
    if task is None:
        return False

    step_stmt = select(TaskStep).where(TaskStep.task_id == task_id)
    steps = session.exec(step_stmt).all()
    for step in steps:
        session.delete(step)

    session.delete(task)
    session.commit()
    return True
