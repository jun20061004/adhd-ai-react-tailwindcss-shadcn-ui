# ADHD AI任务管理器核心目录结构

本章节同时适用于前端 `frontend/` 与后端 `backend/`，关键目录后均附架构职责说明。

## 前端目录树

```
frontend/
├── public/                         # 静态资源与 manifest
├── src/
│   ├── features/                   # 按产品能力划分的业务模块
│   │   └── tasks/                  # 任务相关页面、状态管理、组合逻辑
│   │       ├── components/         # 任务录入框、任务卡片、微步列表
│   │       ├── hooks/              # 任务创建、完成、撤销等业务 hook
│   │       └── types/              # 前端专用的任务、步骤、AI拆解结果类型
│   ├── components/                 # 全局共享组件
│   │   └── ui/                     # shadcn-ui 组件二次封装
│   ├── lib/                        # 通用工具与基础设施
│   │   ├── api.ts                  # fetch 封装、错误处理、请求取消
│   │   ├── auth.ts                 # token 存储、登录态读取
│   │   └── utils.ts                # classname 合并、日期格式化
│   ├── app/                        # 路由层与布局壳
│   ├── assets/                     # 图片、字体、全局样式变量
│   ├── main.tsx                    # 应用入口
│   └── index.css                   # TailwindCSS 全局样式入口
├── .env                            # 前端环境变量
├── .env.development                # 开发环境变量
├── tailwind.config.js              # Tailwind 主题、动画、颜色变量
├── tsconfig.json                    # TS 路径别名与严格检查
├── vite.config.ts                   # Vite 插件、代理、路径解析
└── package.json                     # 依赖、脚本、 engines
```

- `src/features/`：负责按产品能力组织代码，避免页面级逻辑散落在全局组件里。
- `src/components/ui/`：只存放视觉基础组件，不直接承载业务语义。
- `src/lib/`：存放可跨页面复用的基础设施，如 API 客户端与通用工具函数。
- `src/app/`：负责路由嵌套、全局布局、主题与状态Provider挂载。

## 后端目录树

```
backend/
├── app/
│   ├── main.py                      # FastAPI 应用创建、中间件、路由挂载
│   ├── core/
│   │   ├── config.py                # 全局配置读取：AI base_url、api_key、model、cors origins
│   │   ├── ai.py                    # AsyncOpenAI 客户端封装，兼容 SiliconFlow 或本地 Ollama
│   │   └── security.py              # 认证、依赖注入、异常处理中间件
│   ├── schemas/
│   │   ├── task.py                  # 任务创建、更新、查询、拆解请求与响应的 Pydantic 模型
│   │   └── common.py                # 分页、统一响应、错误码等公共结构
│   ├── services/
│   │   ├── task_service.py          # 任务增删改查、状态流转、历史记录聚合
│   │   ├── ai_service.py            # 单文本 -> 1-15分钟微步动作的拆分逻辑
│   │   └── user_service.py          # 用户配置、专注设置、通知偏好
│   ├── routers/
│   │   ├── tasks.py                 # 任务 RESTful 路由
│   │   ├── health.py                # 健康检查、版本信息
│   │   └── ai.py                    # AI 拆解专用路由
│   └── models/
│       ├── task.py                  # SQLModel/ORM 任务表定义
│       ├── task_step.py             # 任务微步表定义
│       └── user.py                  # 用户配置表定义
├── tests/                           # 单测、集成测试、AI 接口模拟测试
├── .env                             # 后端环境变量
├── .env.example                     # 环境变量示例
├── pyproject.toml                   # 项目元数据、依赖、脚本、工具配置
└── README.md                        # 本地启动、API 文档、架构说明
```

- `app/core/config.py`：集中管理 base_url、api_key、model 等全局参数，决定了 AI 调用路由与容错策略。
- `app/core/ai.py`：封装 AsyncOpenAI 客户端，保证前端无需感知 SiliconFlow 或 Ollama 的接入差异。
- `app/schemas/`：定义前后端数据契约，是 RESTful API 输入输出校验的唯一真实来源。
- `app/services/`：承载核心业务逻辑，确保路由层保持薄封装，便于测试与复用。
- `app/routers/`：对外暴露 RESTful API，负责请求校验、权限校验、响应序列化。
- `app/models/`：负责持久化映射与数据库约束，与服务层形成读写分离边界。
