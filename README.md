# GameGallery

一个现代化的 Web 应用，用于管理你的 Steam 游戏库，像艺术画廊一样优雅地展示你的游戏收藏。

## 🚀 在线访问

**生产环境**: [https://yangzirui-lab.github.io/game-gallery](https://yangzirui-lab.github.io/game-gallery)

直接访问部署好的应用，无需本地安装。

## ✨ 功能特性

- **现代化仪表板**: 美观的交互式 Web 界面，可视化管理你的游戏队列
- **游戏搜索**: 通过 Steam Store 搜索并添加游戏（使用 CORS 代理）
- **游戏列表管理**: 支持游戏状态切换、置顶收藏夹、删除等操作
- **自动同步**: 游戏数据自动保存到 GitHub 仓库
- **Steam 登录**: 可选的 Steam 认证，显示用户资料（当前地区限制不可用）
- **游戏信息**: 显示游戏好评率、发布日期、抢先体验状态等

## 🚀 快速开始

### 前置条件

- Docker 和 Docker Compose
- GitHub Token（用于游戏数据同步）

### 部署步骤

```bash
# 1. 克隆仓库
git clone <repository-url>
cd game-gallery

# 2. 配置后端环境变量
cd backend
cp .env.example .env
# 编辑 .env 文件，填入必要的配置：
# - STEAM_API_KEY: Steam API Key（可选，目前因网络限制暂时不需要）
# - JWT_SECRET: JWT 密钥
cd ..

# 3. 启动所有服务
docker-compose up -d

# 4. 访问应用
# 前端: http://localhost/
# 后端 API: http://localhost:8080
```

## 📋 配置说明

### 环境变量 (backend/.env)

```bash
# 服务器配置
PORT=8080
BASE_URL=http://localhost
FRONTEND_URL=http://localhost

# Steam API 配置（可选）
STEAM_API_KEY=your_api_key_here

# JWT 配置
JWT_SECRET=your_jwt_secret_key

# 代理配置（可选，用于 API 访问）
# SOCKS_PROXY=127.0.0.1:1080
# HTTP_PROXY=http://proxy.example.com:8080
```

### GitHub 配置（通过应用内设置）

1. 打开应用，点击右上角设置图标
2. 在 "GitHub 配置" 部分填入 GitHub Token
3. 确保 Token 具有 `repo` 权限
4. 点击"测试连接"验证配置

## 🎮 使用指南

### 搜索和添加游戏

1. 打开应用主页
2. 在顶部搜索框输入游戏名称
3. 从搜索结果中选择游戏
4. 游戏会被添加到"待玩"列表

### 管理游戏列表

- **切换状态**: 点击游戏卡片上的状态按钮，可在"待玩"→"游玩中"→"已完成"之间切换
- **置顶游戏**: 点击星号图标，将喜爱的游戏置顶
- **删除游戏**: 点击删除按钮移除游戏
- **自动同步**: 所有更改会自动保存到 GitHub

### Steam 登录（可选）

1. 打开应用设置
2. 在 "Steam 账号" 部分点击 "Sign in with Steam"
3. 授权后，你的 Steam 资料会显示在设置页面

**注意**: Steam 登录功能因地区网络限制可能不可用

## 🏗️ 架构概览

```
GameGallery
├── Frontend (React + TypeScript)
│   ├── web/src/
│   │   ├── components/     # React 组件
│   │   ├── services/       # API 调用和业务逻辑
│   │   └── App/           # 主应用组件
│   └── Nginx              # 静态文件服务和反向代理
│
├── Backend (Go)
│   ├── internal/
│   │   ├── api/          # HTTP 处理器
│   │   ├── auth/         # Steam OpenID 认证
│   │   ├── config/       # 配置管理
│   │   ├── models/       # 数据模型
│   │   └── services/     # 业务服务（支持代理）
│   └── Dockerfile        # Go 应用容器
│
└── docker-compose.yml    # 容器编排配置
```

## 📡 API 端点

### 认证相关

- `GET /api/auth/steam` - 启动 Steam OpenID 登录
- `GET /api/auth/steam/callback` - Steam 回调处理

### 游戏相关（暂未启用）

- `GET /api/games/search?q=<query>&limit=10` - 搜索游戏
- `GET /api/games/cache-stats` - 查看缓存统计

### 健康检查

- `GET /api/health` - 后端健康检查

### 部署环境

- **Frontend**: GitHub Pages (https://yangzirui-lab.github.io/game-gallery) 或 Docker + Nginx
- **API**: Docker + Go Backend 或 Vercel Serverless Functions

## 🌐 前端功能说明

### 游戏搜索

前端使用多个 CORS 代理进行 Steam Store API 查询：

- `api.allorigins.win`
- `corsproxy.io`
- `api.codetabs.com`

系统会自动尝试多个代理以确保请求成功。

### 游戏详情获取

通过 CORS 代理获取游戏详细信息，包括：

- 好评率（%）
- 总评论数
- 发布日期
- 抢先体验状态
- 游戏分类

## 🛠️ 后端功能（暂未启用）

后端已实现以下功能，可根据需要启用：

1. **游戏列表缓存**: 支持 Steam Web API 游戏列表缓存（需代理访问）
2. **搜索缓存**: 10 分钟搜索结果缓存，提高性能
3. **代理支持**: 支持 SOCKS5 和 HTTP 代理配置

### 启用后端搜索 API

当配置好网络代理后，可修改前端代码以使用后端搜索端点：

```typescript
// web/src/services/steam.ts
// 改为调用: http://localhost/api/games/search?q=<query>
```

## 📦 项目结构

```
game-gallery/
├── backend/              # Go 后端应用
│   ├── main.go
│   ├── go.mod
│   ├── go.sum
│   ├── .env.example
│   ├── internal/
│   ├── Dockerfile.linux
│   └── ...
├── web/                  # React 前端应用
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   ├── nginx.conf
│   └── ...
├── docker-compose.yml    # Docker 编排配置
├── nginx.conf            # Nginx 反向代理配置
└── README.md            # 本文件
```

## 🔒 安全说明

- 不要在代码中提交 `.env` 文件或敏感信息
- GitHub Token 应该具有最小必要权限（仅 `repo` 权限）
- 后端 API Key 不应该暴露在前端代码中
- 使用 HTTPS 在生产环境部署

## 📝 常见问题

### 1. Steam 登录不可用

**原因**: 某些地区（如中国）可能无法访问 Steam 认证服务

**解决方案**:

- 使用 VPN 或代理
- 配置后端的 SOCKS5 代理支持

### 2. 游戏搜索失败

**原因**: CORS 代理服务可能不可用

**解决方案**:

- 等待几秒后重试
- 系统会自动尝试其他代理
- 检查网络连接

### 3. GitHub 同步失败

**原因**: Token 权限不足或仓库不存在

**解决方案**:

- 确认 Token 具有 `repo` 权限
- 检查仓库是否存在且可访问
- 点击"测试连接"诊断问题

## 📚 相关文档

- [STEAM_LOGIN_GUIDE.md](./STEAM_LOGIN_GUIDE.md) - Steam 登录详细配置
- [BACKEND_SETUP.md](./BACKEND_SETUP.md) - 后端详细部署指南
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 生产环境部署说明

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**最后更新**: 2026-01-26

**当前版本**: v1.0 (Docker + Go Backend)
