# Windows Server 2019 部署指南

## 快速开始

### 方式一：使用部署脚本（推荐）

```powershell
# 全栈部署（后端用 Windows 容器 + 前端用 IIS）
.\deploy-full-stack.ps1

# 或指定前端使用 Docker（需要 Linux 容器支持）
.\deploy-full-stack.ps1 -FrontendMode docker
```

### 方式二：分别部署

```powershell
# 1. 部署后端（Windows 容器）
.\deploy-windows.ps1

# 2. 部署前端（选择一种）
.\deploy-frontend-iis.ps1      # IIS 方式（推荐）
.\deploy-frontend-docker.ps1   # Docker 方式（需要 Linux 容器）
```

---

## 命令行区分 Linux/Windows 容器

### 后端部署

**使用 Windows 容器（适合 Windows Server 2019）：**

```powershell
docker build -f .\backend\Dockerfile -t game-gallery-backend:windows .\backend
docker run -d -p 8080:8080 --env-file .\backend\.env --name game-gallery-backend game-gallery-backend:windows
```

**使用 Linux 容器（需要 Docker Desktop + WSL2）：**

```powershell
docker build -f .\backend\Dockerfile.linux -t game-gallery-backend:linux .\backend
docker run -d -p 8080:8080 --env-file .\backend\.env --name game-gallery-backend game-gallery-backend:linux
```

---

### 前端部署

**方案 A：IIS 部署（推荐，性能最好）**

```powershell
# 1. 构建前端
cd web
npm install
npm run build

# 2. 部署到 IIS
.\deploy-frontend-iis.ps1
```

**方案 B：Linux 容器（需要 Docker Desktop）**

```powershell
docker build -f .\web\Dockerfile -t game-gallery-frontend .\web
docker run -d -p 80:80 --name game-gallery-frontend game-gallery-frontend
```

**方案 C：Windows 容器（不推荐，镜像太大）**

- 需要创建专门的 Windows Dockerfile
- 镜像体积 > 1GB

---

## 部署前准备

### 1. 安装 Node.js（构建前端需要）

```powershell
# 下载并安装 Node.js 18 LTS
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri "https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi" -OutFile "node-installer.msi" -UseBasicParsing

# 安装
msiexec /i node-installer.msi /quiet

# 验证（需要重新打开 PowerShell）
node --version
npm --version
```

### 2. 配置环境变量

**后端配置（backend\.env）：**

```env
PORT=8080
BASE_URL=http://你的服务器IP:8080
STEAM_API_KEY=你的Steam_API_Key
JWT_SECRET=随机生成的强密码
FRONTEND_URL=http://你的服务器IP
```

**前端配置（web\.env.production）：**

```env
# 如果前端和后端在同一服务器
VITE_API_URL=http://你的服务器IP:8080

# 如果通过 Nginx 代理，可以留空
VITE_API_URL=
```

---

## Docker 容器模式切换

### 切换到 Windows 容器模式

```powershell
# 如果使用 Docker Desktop
& "C:\Program Files\Docker\Docker\DockerCli.exe" -SwitchWindowsEngine

# 验证
docker info
# 输出中应显示：OSType: windows
```

### 切换到 Linux 容器模式

```powershell
# 如果使用 Docker Desktop
& "C:\Program Files\Docker\Docker\DockerCli.exe" -SwitchLinuxEngine

# 验证
docker info
# 输出中应显示：OSType: linux
```

**注意：** 原生 Docker Engine（非 Docker Desktop）只支持 Windows 容器，无法切换到 Linux 容器。

---

## 推荐的部署架构

### 架构 A：混合模式（最优）

- **后端**: Windows 容器（Dockerfile）
- **前端**: IIS 静态托管
- **优点**: 性能好，资源占用少

### 架构 B：纯容器（需要 Docker Desktop）

- **后端**: Linux 容器（Dockerfile.linux）
- **前端**: Linux 容器（Dockerfile）
- **优点**: 跨平台一致性

### 架构 C：纯 Windows 容器（不推荐）

- **后端**: Windows 容器
- **前端**: Windows 容器
- **缺点**: 镜像巨大，资源消耗高

---

## 防火墙配置

```powershell
# HTTP (前端)
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80

# HTTPS（如果配置了 SSL）
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 443

# 后端 API
New-NetFirewallRule -DisplayName "Game Gallery Backend" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8080
```

---

## 常用管理命令

```powershell
# 查看所有容器
docker ps -a

# 查看日志
docker logs game-gallery-backend
docker logs -f game-gallery-backend  # 实时日志

# 重启服务
docker restart game-gallery-backend

# 停止服务
docker stop game-gallery-backend
docker stop game-gallery-frontend

# 删除容器（重新部署前）
docker rm -f game-gallery-backend
docker rm -f game-gallery-frontend

# 查看镜像
docker images

# 删除旧镜像
docker rmi game-gallery-backend:windows
```

---

## 故障排查

### 后端无法访问

```powershell
# 检查容器状态
docker ps -a

# 查看详细日志
docker logs game-gallery-backend --tail 50

# 检查端口占用
netstat -ano | findstr :8080

# 测试健康检查
curl http://localhost:8080/health
```

### 前端 IIS 404 错误

- 确保安装了 URL Rewrite 模块
- 检查 web.config 是否存在于 IIS 目录
- 重启 IIS：`iisreset`

### Docker 构建慢或失败

```powershell
# 清理 Docker 缓存
docker system prune -a

# 重新构建（不使用缓存）
docker build --no-cache -f .\backend\Dockerfile -t game-gallery-backend:windows .\backend
```

---

## 更新部署

```powershell
# 拉取最新代码
git pull

# 重新运行部署脚本
.\deploy-full-stack.ps1
```

---

## 性能优化建议

1. **使用 IIS 部署前端**（比容器快）
2. **后端使用 Windows 容器**（兼容性好）
3. **配置 IIS 静态文件缓存**
4. **使用 CDN 加速静态资源**（可选）

---

需要帮助？检查日志或提交 issue。
