# electron-trpc-inversify 项目文档

## 项目概述

这是一个基于 Electron + tRPC + Inversify 的桌面应用开发模板，提供了类似 NestJS 的后端代码编写体验，同时使用 tRPC 实现类型安全的 API 通信。

### 技术栈

- **前端**: Vue 3 + TypeScript + Tailwind CSS
- **后端**: Electron Main Process + Inversify (依赖注入) + tRPC
- **构建工具**: electron-vite + Vite
- **包管理**: pnpm

### 核心特性

- 使用 Inversify 实现依赖注入，提供类似 NestJS 的模块化架构
- 通过 tRPC 实现主进程和渲染进程之间的类型安全通信
- 支持插件系统，可动态加载和管理插件
- 完整的 TypeScript 支持

## 项目结构

```
src/
├── main/                    # 主进程代码
│   ├── modules/            # 业务模块
│   │   ├── app.module.ts   # 应用模块
│   │   ├── window/         # 窗口管理
│   │   ├── example/        # 示例模块
│   │   ├── plugin/         # 插件系统
│   │   └── trpc/           # tRPC 服务
│   ├── extensions/         # 扩展系统
│   ├── ipc/               # IPC 通信
│   └── trpc/              # tRPC 配置
├── preload/               # 预加载脚本
│   ├── index.ts          # 主预加载
│   ├── extension.ts      # 扩展预加载
│   └── plugin.ts         # 插件预加载
└── renderer/             # 渲染进程代码
    ├── src/
    │   ├── views/        # 页面组件
    │   ├── components/   # UI 组件
    │   ├── trpc/        # tRPC 客户端
    │   └── lib/         # 工具库
    └── index.html       # 入口 HTML
```

## 构建和运行

### 开发环境

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev
```

### 构建命令

```bash
# 类型检查
pnpm run typecheck

# 构建应用
pnpm run build

# 构建并打包（不压缩）
pnpm run build:unpack

# 构建并打包为 Windows 应用
pnpm run build:win

# 构建并打包为 macOS 应用
pnpm run build:mac

# 构建并打包为 Linux 应用
pnpm run build:linux
```

### 其他命令

```bash
# 代码格式化
pnpm run format

# 代码检查
pnpm run lint

# 启动预览
pnpm run start
```

## 开发约定

### 模块化架构

项目采用 Inversify 实现依赖注入，每个功能模块包含：

- **Module**: 定义模块的依赖注入配置
- **Service**: 业务逻辑实现
- **Router**: tRPC 路由定义

### 创建新模块

1. 创建模块目录：`src/main/modules/your-module/`
2. 创建三个核心文件：
   - `your-module.module.ts` - 模块配置
   - `your-module.service.ts` - 服务实现
   - `your-module.router.ts` - tRPC 路由
3. 在 `src/main/modules/di.ts` 中注册新模块
4. 在 `src/main/modules/app.router.ts` 中合并路由

### tRPC 使用约定

- 主进程路由定义在 `*-router.ts` 文件中
- 渲染进程通过 `trpcClient` 调用主进程 API
- 使用 Zod 进行数据验证

### 插件开发

插件系统支持：
- 动态加载插件进程
- 通过 IPC 与主进程通信
- 在 WebContentsView 中渲染插件 UI

### 代码风格

- 使用 ESLint + Prettier 进行代码格式化
- 遵循 TypeScript 严格模式
- 使用装饰器进行依赖注入

## 关键配置文件

- `electron.vite.config.ts` - Electron 构建配置
- `package.json` - 项目依赖和脚本
- `tsconfig.json` - TypeScript 配置
- `eslint.config.mjs` - ESLint 配置
- `.prettierrc.yaml` - Prettier 配置

## 插件系统

项目包含一个完整的插件系统：

1. 插件运行在独立的子进程中
2. 通过 tRPC 与主进程通信
3. 插件 UI 在 WebContentsView 中渲染
4. 支持插件的动态加载和卸载

插件相关代码位于 `src/main/modules/plugin/` 和 `src/extensions/`。

## 扩展系统

支持通过扩展进程加载外部功能，相关代码在 `src/extensions/` 目录。