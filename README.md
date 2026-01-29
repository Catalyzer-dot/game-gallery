# Game Gallery

一个现代化的游戏收藏管理应用。

## 本地开发

### 前置要求

- Node.js 20+
- Docker
- Git

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/yangzirui-lab/game-gallery.git
cd game-gallery

# 启动后端
cd backend
cp .env.example .env
# 编辑 .env 填入必要配置（可选）
docker-compose up -d backend

# 启动前端
cd ../web
npm install
npm run dev
```

访问 http://localhost:5173

### 环境变量

在 `backend/.env` 中配置：

```bash
PORT=8080
BASE_URL=http://localhost
FRONTEND_URL=http://localhost
JWT_SECRET=your_secret_key

# 可选
STEAM_API_KEY=your_steam_api_key
```
