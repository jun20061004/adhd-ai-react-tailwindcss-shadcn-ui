# ADHD AI任务管理器初始化命令清单

本清单面向Windows环境，默认使用PowerShell。命令按照推荐执行顺序排列。

## 1. 前端（Vite + React + TailwindCSS + shadcn-ui）

```powershell
# 进入项目根目录
cd <项目根目录>

# 查看Node.js与npm版本（需Node 18或更高）
node --version
npm --version

# 使用Vite官方脚手架创建前端项目
npm create vite@latest frontend -- --template react-ts

# 进入前端目录，安装基础依赖
cd frontend
npm install

# 安装TailwindCSS v4及Vite插件
npm install -D tailwindcss @tailwindcss/vite

# 安装shadcn-ui所需的依赖库
npm install class-variance-authority clsx tailwind-merge lucide-react

# 安装Radix UI原子组件
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-popover @radix-ui/react-separator @radix-ui/react-scroll-area @radix-ui/react-toast @radix-ui/react-tooltip

# 安装TypeScript路径别名支持
npm install -D @types/node

# 初始化shadcn-ui配置（会自动生成components.json、src/lib/utils.ts等）
npx shadcn@latest init

# 添加常用shadcn-ui组件
npx shadcn@latest add button card input progress toast sonner command dialog badge alert-dialog separator scroll-area tooltip
```

前端需手动完成的关键配置文件：
- `vite.config.ts`：配置`@vitejs/plugin-react`、`tailwindcss`插件、路径别名`@`
- `tsconfig.json`与`tsconfig.app.json`：配置`paths`中`@/*`映射
- `src/index.css`：使用`@import "tailwindcss"`并引入shadcn-ui主题变量
- `components.json`：由`npx shadcn@latest init`自动生成，不要手写

## 2. 后端（FastAPI + Pydantic + AsyncOpenAI）

```powershell
# 回到项目根目录
cd <项目根目录>

# 创建后端目录
mkdir backend
cd backend

# 创建Python虚拟环境
python -m venv .venv

# 激活虚拟环境
.\.venv\Scripts\Activate.ps1

# 安装核心依赖
pip install fastapi uvicorn[standard] pydantic pydantic-settings python-dotenv

# 安装数据库与持久化依赖
pip install sqlmodel aiosqlite

# 安装AI依赖
pip install openai httpx

# 创建后端目录结构骨架
mkdir app\core
mkdir app\schemas
mkdir app\services
mkdir app\routers
mkdir app\models
mkdir tests

# 在各目录创建__init__.py（使目录成为Python包）
foreach ($dir in @("app", "app\core", "app\schemas", "app\services", "app\routers", "app\models")) {
    New-Item -Path $dir -Name "__init__.py" -ItemType File -Force | Out-Null
}

# 启动FastAPI开发服务器（默认端口8000）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端环境变量示例（`backend/.env`）：
```
APP_ENV=development
DATABASE_URL=sqlite+aiosqlite:///./tasks.db
CORS_ORIGINS=http://localhost:5173

# SiliconFlow
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_API_KEY=your_siliconflow_api_key
SILICONFLOW_MODEL=Qwen/Qwen2.5-7B-Instruct

# 本地Ollama
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_API_KEY=ollama
OLLAMA_MODEL=qwen2.5:7b
```

## 3. 跨端联调

```powershell
# 终端一：启动前端（默认端口5173）
cd <项目根目录>/frontend
npm run dev

# 终端二：启动后端（默认端口8000）
cd <项目根目录>/backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

前后端通信建议使用`/api/v1`前缀，RESTful接口设计：
- `POST /api/v1/tasks`：创建任务，单文本字段，触发AI拆解
- `GET /api/v1/tasks`：获取任务列表
- `PATCH /api/v1/tasks/{task_id}`：更新任务状态
- `DELETE /api/v1/tasks/{task_id}`：删除任务
- `POST /api/v1/tasks/{task_id}/steps`：为任务添加手动微步
- `PATCH /api/v1/tasks/{task_id}/steps/{step_id}`：完成或跳过单个微步

前端`vite.config.ts`中配置代理以规避CORS：
```ts
// vite.config.ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
```
