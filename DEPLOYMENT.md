# Windows Server 2019 自动部署配置指南

本指南帮助你在 Windows Server 2019 上部署 Game Gallery 应用（适用于公开仓库）。

## 架构说明

- **CI/CD**: GitHub Actions 在云端构建镜像和前端资源
- **镜像存储**: GitHub Container Registry (GHCR)
- **后端**: Go 应用运行在 Windows Docker 容器中
- **前端**: React 应用部署到 IIS
- **部署方式**: 服务器端脚本从 GHCR 拉取镜像，从 GitHub 拉取前端构建产物

## 前置要求

在 Windows Server 2019 上需要安装：

1. **Docker Desktop for Windows** 或 **Docker Engine**
   - 确保启用 Windows 容器模式
   - 运行 `docker version` 验证安装

2. **Git for Windows**
   - 下载地址: https://git-scm.com/download/win
   - 用于从 GitHub 拉取前端构建产物

3. **IIS (Internet Information Services)**
   - 包含 URL Rewrite 模块（用于 SPA 路由）

4. **PowerShell 5.1+** (Windows Server 2019 自带)

## 部署流程

### 工作原理

1. 开发者推送代码到 `main` 分支
2. GitHub Actions 自动触发：
   - 构建后端 Windows 容器镜像 → 推送到 GHCR
   - 构建前端静态文件 → 推送到 `dist` 分支
3. 在 Windows Server 上运行部署脚本：
   - 从 GHCR 拉取最新后端镜像
   - 从 `dist` 分支拉取前端构建产物
   - 自动部署到 Docker 和 IIS

### 第一步: 配置服务器环境

#### 1.1 安装 Docker

确保 Docker 已安装并运行在 Windows 容器模式：

```powershell
# 检查 Docker
docker version

# 如果需要切换到 Windows 容器模式
& $Env:ProgramFiles\Docker\Docker\DockerCli.exe -SwitchDaemon
```

#### 1.2 安装 Git

```powershell
# 检查 Git 是否已安装
git --version

# 如未安装，下载并安装 Git for Windows
# https://git-scm.com/download/win
```

#### 1.3 安装和配置 IIS

```powershell
# 安装 IIS
Install-WindowsFeature -Name Web-Server -IncludeManagementTools

# 安装 URL Rewrite 模块（必需）
# 手动下载并安装: https://www.iis.net/downloads/microsoft/url-rewrite
```

#### 1.4 配置防火墙

```powershell
# 允许 HTTP (80端口)
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80

# 允许后端 API (8080端口)
New-NetFirewallRule -DisplayName "Game Gallery API" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8080
```

### 第二步: 配置后端环境变量

创建后端环境配置文件：

```powershell
# 创建项目目录
mkdir C:\game-gallery
cd C:\game-gallery

# 创建 backend 目录
mkdir backend

# 创建 .env 文件
@"
# Steam API Configuration
STEAM_API_KEY=your_steam_api_key_here

# Server Configuration
PORT=8080
"@ | Out-File -FilePath .\backend\.env -Encoding ASCII

# 编辑配置
notepad .\backend\.env
```

获取 Steam API Key: https://steamcommunity.com/dev/apikey

### 第三步: 下载部署脚本

```powershell
# 下载部署脚本
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/$REPO_OWNER/$REPO_NAME/main/server-deploy.ps1" -OutFile "server-deploy.ps1"
```

### 第四步: 执行部署

#### 首次部署（镜像为公开）

```powershell
.\server-deploy.ps1
```

#### 如果镜像设置为私有

需要创建 GitHub Personal Access Token (PAT)：

1. 访问 GitHub Settings: https://github.com/settings/tokens
2. 点击 **Generate new token (classic)**
3. 权限选择: `read:packages`
4. 复制生成的 token

然后运行：

```powershell
.\server-deploy.ps1 -GithubToken "ghp_your_token_here"
```

#### 部署特定版本

```powershell
# 部署指定 commit 的版本
.\server-deploy.ps1 -BackendImageTag "main-abc1234"
```

### 第五步: 设置定时自动部署（可选）

使用 Windows 任务计划程序定时拉取最新版本：

```powershell
# 创建每天凌晨 2 点自动部署的任务
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\game-gallery\server-deploy.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName "GameGallery-AutoDeploy" `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description "Automatically deploy Game Gallery updates"
```

## 验证部署

部署完成后，访问以下地址验证：

- **前端**: `http://YOUR_SERVER_IP/`
- **后端 API**: `http://YOUR_SERVER_IP:8080/`
- **健康检查**: `http://YOUR_SERVER_IP:8080/health`

## 故障排查

### GitHub Actions 构建失败

查看 GitHub Actions 日志：

- 访问仓库的 **Actions** 标签页
- 查看失败的 workflow run
- 检查具体步骤的错误信息

### 无法拉取镜像

```powershell
# 检查 Docker 登录状态
docker login $REGISTRY -u $REPO_OWNER

# 手动拉取测试
docker pull ghcr.io/yangzirui-lab/game-gallery/backend:latest

# 检查镜像权限
# 访问: https://github.com/yangzirui-lab/game-gallery/pkgs/container/game-gallery%2Fbackend
```

### 前端文件下载失败

```powershell
# 手动测试 Git 克隆
git clone -b dist --depth 1 https://github.com/yangzirui-lab/game-gallery.git test-clone

# 检查网络连接
Test-NetConnection github.com -Port 443
```

### Docker 服务问题

```powershell
# 重启 Docker 服务
Restart-Service docker

# 检查 Docker 信息
docker info

# 切换到 Windows 容器模式
& $Env:ProgramFiles\Docker\Docker\DockerCli.exe -SwitchDaemon
```

### IIS 网站无法访问

```powershell
# 检查网站状态
Import-Module WebAdministration
Get-Website -Name "GameGallery"

# 启动网站
Start-WebSite -Name "GameGallery"

# 检查端口占用
netstat -ano | findstr :80
```

## 监控与日志

### 查看后端日志

```powershell
# 实时日志
docker logs -f game-gallery-backend

# 最近 100 行日志
docker logs --tail 100 game-gallery-backend
```

### 查看 IIS 日志

```powershell
Get-Content C:\inetpub\logs\LogFiles\W3SVC*\*.log -Tail 50
```

### 查看容器状态

```powershell
docker ps -a
docker stats game-gallery-backend
```

## 高级配置

### 使用自定义域名

1. 在 DNS 中配置 A 记录指向服务器 IP
2. 在 IIS 中添加网站绑定：

```powershell
Import-Module WebAdministration
New-WebBinding -Name "GameGallery" -Protocol http -Port 80 -HostHeader "yourdomain.com"
```

### 配置 HTTPS

1. 获取 SSL 证书（可使用 Let's Encrypt）
2. 在 IIS 中导入证书
3. 添加 HTTPS 绑定：

```powershell
New-WebBinding -Name "GameGallery" -Protocol https -Port 443 -HostHeader "yourdomain.com"
```

4. 更新前端环境变量（如需要）

### 配置环境变量

在 `backend\.env` 中添加更多配置：

```env
# Steam API
STEAM_API_KEY=your_steam_api_key

# Server
PORT=8080
BASE_URL=http://yourdomain.com
FRONTEND_URL=http://yourdomain.com

# JWT
JWT_SECRET=your_jwt_secret_key

# Proxy (如果需要)
# SOCKS_PROXY=127.0.0.1:1080
```

### 多环境部署

可以创建不同的部署脚本：

- `server-deploy-staging.ps1` - 测试环境（从 staging 分支部署）
- `server-deploy-production.ps1` - 生产环境（从 main 分支部署）

## 安全建议

1. **镜像访问控制**:
   - 公开仓库的镜像默认是公开的
   - 如需私有镜像，在 GitHub Package 设置中修改可见性
   - 使用 PAT (Personal Access Token) 拉取私有镜像

2. **环境变量保护**:
   - 不要在代码中提交 `.env` 文件
   - 使用强密码和密钥

3. **网络安全**:
   - 配置防火墙只开放必要端口
   - 考虑使用 HTTPS
   - 限制管理端口访问

4. **定期更新**:
   - 定期更新 Docker 和系统补丁
   - 定期拉取最新镜像部署

## 维护操作

### 手动更新部署

```powershell
cd C:\game-gallery
.\server-deploy.ps1
```

### 回滚到特定版本

```powershell
# 查看可用的镜像标签
# 访问: https://github.com/yangzirui-lab/game-gallery/pkgs/container/game-gallery%2Fbackend

# 部署特定版本
.\server-deploy.ps1 -BackendImageTag "main-abc1234"
```

### 清理旧镜像

```powershell
# 清理未使用的镜像
docker image prune -a -f

# 清理未使用的容器
docker container prune -f
```

### 重启服务

```powershell
# 重启后端容器
docker restart game-gallery-backend

# 重启 IIS 站点
Import-Module WebAdministration
Restart-WebAppPool -Name "GameGallery"
Restart-WebSite -Name "GameGallery"
```

## 自动化部署（Webhook 方式，可选）

如果想在 GitHub Actions 完成后自动触发服务器部署，可以配置 webhook：

### 1. 在服务器创建 webhook 监听脚本

创建 `webhook-listener.ps1`:

```powershell
# 简单的 HTTP 监听器
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:9000/webhook/")
$listener.Start()

Write-Host "Webhook listener started on port 9000"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $response = $context.Response

    # 触发部署
    Write-Host "Webhook received, starting deployment..."
    Start-Process PowerShell -ArgumentList "-File C:\game-gallery\server-deploy.ps1" -NoNewWindow

    $response.StatusCode = 200
    $response.Close()
}
```

### 2. 在 GitHub Actions 中添加 webhook 调用

在 `.github/workflows/deploy-windows.yml` 末尾添加：

```yaml
- name: Trigger server deployment
  run: |
    curl -X POST http://YOUR_SERVER_IP:9000/webhook/
```

### 3. 将 webhook 监听器配置为 Windows 服务

使用 NSSM 或任务计划程序运行 webhook 监听脚本。

## 参考资料

- [GitHub Container Registry 文档](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Windows Container 文档](https://learn.microsoft.com/en-us/virtualization/windowscontainers/)
- [IIS URL Rewrite 文档](https://learn.microsoft.com/en-us/iis/extensions/url-rewrite-module/)
- [Docker on Windows 文档](https://docs.docker.com/desktop/install/windows-install/)
