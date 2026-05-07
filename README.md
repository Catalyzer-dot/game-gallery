# Game Gallery

游戏收藏管理平台 - Monorepo

一个用于管理个人 Steam 游戏收藏的 Web 应用，支持游戏状态管理、自动数据同步、内置小游戏等功能。

## ✨ 主要特性

- 🎮 **游戏收藏管理**：支持添加、编辑、删除 Steam 游戏
- 📊 **游戏状态追踪**：Playing、Queueing、Completion 三种状态
- 🔄 **自动数据同步**：后端定时任务每 2 小时更新游戏评论、发布信息
- 🎯 **内置小游戏**：10+ 款经典小游戏可玩
- 📱 **响应式设计**：完美支持桌面端和移动端
- 🔐 **用户认证**：支持登录、注册、会话管理
- 🎨 **现代 UI**：基于 React + TypeScript，流畅的动画效果

## 项目结构

```
degenerates-frontend/
├── apps/
│   └── web/                    # 前端应用 (React + Vite)
│       ├── src/
│       │   ├── components/     # UI 组件
│       │   ├── services/       # API 服务层
│       │   ├── hooks/          # 自定义 Hooks
│       │   ├── types/          # TypeScript 类型定义
│       │   └── utils/          # 工具函数
│       └── public/             # 静态资源
├── games.json                  # 游戏数据备份
├── GAME_REFRESH_SPEC.md        # 游戏数据刷新规范文档
└── package.json                # Monorepo 配置
```

**后端仓库**: [degenerates-backend](https://github.com/catalyzer-dot/degenerates-backend)

## 🚀 本地开发

### 前置要求

- Node.js 20+
- pnpm 8+ (推荐) 或 npm
- Git

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/catalyzer-dot/degenerates-frontend.git
cd degenerates-frontend

# 安装依赖
npm install

# 启动前端开发服务器
npm run dev
```

访问 http://localhost:5173

### 环境变量

在 `apps/web/.env` 中配置：

```bash
# API 地址
VITE_API_URL=https://degenerates.site/api

# 本地开发时使用
# VITE_API_URL=http://localhost:8080/api
```

> 注意：本地开发需要后端服务运行，请参考 [degenerates-backend](https://github.com/catalyzer-dot/degenerates-backend) 仓库。

### 构建生产版本

```bash
# 构建前端应用
npm run build

# 预览构建结果
npm run preview
```

## 🏗️ 技术栈

### 前端

- **框架**：React 18 + TypeScript
- **构建工具**：Vite 5
- **状态管理**：React Hooks (无需额外状态库)
- **UI 组件**：自定义组件 + Lucide Icons
- **动画**：Framer Motion
- **样式**：SCSS Modules
- **HTTP 客户端**：原生 Fetch API

### 后端

见 [degenerates-backend](https://github.com/catalyzer-dot/degenerates-backend) 仓库

## 📚 核心功能说明

### 游戏状态管理

- **Playing**：正在玩的游戏
- **Queueing**：待玩清单
- **Completion**：已完成游戏

支持拖拽排序、置顶、删除等操作。

### 数据刷新策略

- **后端定时任务**：每 2 小时自动刷新所有游戏的评论数据、发布信息
- **前端智能刷新**：
  - 首次加载时只刷新缺少数据的游戏
  - 新添加的游戏立即获取最新数据
  - 已有完整数据的游戏跳过刷新，由后端维护

详见 [GAME_REFRESH_SPEC.md](./GAME_REFRESH_SPEC.md)

### 内置小游戏

- 🐍 贪吃蛇
- 🎮 打砖块
- 🧩 2048
- 🎯 记忆卡片
- 🏃 跳跃游戏
- 🎣 水果接接乐
- 🎨 消消乐
- 📦 推箱子
- 🗼 塔防游戏
- 🐦 Flappy Bird

## 📝 开发规范

### 代码风格

- 使用 ESLint + Prettier 进行代码检查和格式化
- 遵循 React Hooks 最佳实践
- TypeScript 严格模式

### Git 提交规范

使用 Conventional Commits：

```
feat: 新功能
fix: 修复 bug
refactor: 重构代码
docs: 文档更新
style: 代码格式调整
test: 测试相关
chore: 构建/工具链相关
```

### 文件组织

- **组件**：按功能模块组织，使用 `index.tsx` + `index.module.scss`
- **Hooks**：自定义 Hooks 放在 `src/hooks/` 目录
- **服务**：API 调用封装在 `src/services/` 目录
- **工具**：通用工具函数放在 `src/utils/` 目录

## 🔧 常用脚本

```bash
# 开发
npm run dev              # 启动开发服务器

# 构建
npm run build            # 构建生产版本
npm run preview          # 预览构建结果

# 代码检查
npm run lint             # ESLint 检查
npm run type-check       # TypeScript 类型检查

# 格式化
npm run format           # Prettier 格式化代码
```

## 📄 备案信息

- ICP 备案号：桂ICP备2026002060号
- 公安备案号：桂公网安备45010502001153号

## 📞 联系方式

- GitHub: [@Catalyzer-dot](https://github.com/Catalyzer-dot)
- 问题反馈: [Issues](https://github.com/Catalyzer-dot/degenerates-frontend/issues)

## 📜 License

MIT License
