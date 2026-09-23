from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

def _build_engine():
    #移除可能存在的异步引擎前缀,强制降级为官方推荐的同步sqlite驱动
    #解决全局同步Session与异步底层驱动之间的阻抗失配
    sync_url = settings.database_url.replace("sqlite+aiosqlite", "sqlite")

    # 定义SQLite特有的连接参数
    # 参数解析：check_same_thread 为 False 允许不同的线程访问同一个 SQLite 数据库连接。
    # 全局作用：FastAPI底层使用多线程(Threadpool)来处理同步的路由请求。如果不关闭此检查，当不同的请求线程尝试复用全局的 engine 连接池时，SQLite底层的C语言库会直接抛出线程安全异常，导致接口大面积500崩溃。
    connect_args = {"check_same_thread": False}

    return create_engine(sync_url, connect_args=connect_args)

engine = _build_engine()

def init_db():
    #撤销之前的异步修改,恢复为官方标准的同步建表逻辑
    #全局作用：在FastAPI应用启动生命周期(startup event)中被调用，根据SQLModel中定义的模型类，在SQLite本地文件中自动映射并创建所有确实的物理数据表。
    SQLModel.metadata.create_all(engine)

def get_session():
    # 全局作用：配合 FastAPI 的 Depends() 机制使用。通过 yield 抛出 session，将连接的开启与关闭(finally层面的释放)完全移交给 FastAPI 的底层依赖执行图来管理，实现请求级别的绝对数据隔离。
    with Session(engine) as session:
        yield session