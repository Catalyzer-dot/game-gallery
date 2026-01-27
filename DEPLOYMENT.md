# Windows Server 2019 自动部署配置指南

本指南帮助你在 Windows Server 2019 上设置 GitHub Actions 自动部署。

## 架构说明

- **后端**: Go 应用运行在 Windows Docker 容器中
- **前端**: React 应用部署到 IIS
- **CI/CD**: GitHub Actions + Self-hosted Runner

## 前置要求

在 Windows Server 2019 上需要安装：

1. **Docker Desktop for Windows** 或 **Docker Engine**
   - 确保启用 Windows 容器模式
   - 运行 `docker version` 验证安装

2. **IIS (Internet Information Services)**
   - 包含 URL Rewrite 模块（用于 SPA 路由）

3. **Node.js 18+**
   - 下载地址: https://nodejs.org/

4. **PowerShell 5.1+** (Windows Server 2019 自带)

## 设置步骤

### 第一步: 在服务器上安装 GitHub Actions Self-hosted Runner

1. **进入 GitHub 仓库设置**
   - 打开仓库: `https://github.com/yangzirui-lab/game-gallery`
   - 点击 **Settings** > **Actions** > **Runners**
   - 点击 **New self-hosted runner**

2. **选择 Windows 系统**
   - 操作系统: **Windows**
   - 架构: **x64**

3. **在服务器上执行安装命令**

   打开 PowerShell（管理员权限）并执行：

   ```powershell
   # 创建工作目录
   mkdir C:\actions-runner
   cd C:\actions-runner

   # 下载 Runner（GitHub 会提供最新版本链接）
   # 示例命令（请使用 GitHub 页面上的实际命令）:
   Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.xxx.x/actions-runner-win-x64-2.xxx.x.zip -OutFile actions-runner-win-x64.zip

   # 解压
   Add-Type -AssemblyName System.IO.Compression.FileSystem
   [System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD\actions-runner-win-x64.zip", "$PWD")

   # 配置 Runner（使用 GitHub 提供的 token）
   .\config.cmd --url https://github.com/yangzirui-lab/game-gallery --token YOUR_TOKEN_FROM_GITHUB

   # 安装为 Windows 服务（推荐）
   .\svc.cmd install

   # 启动服务
   .\svc.cmd start
   ```

4. **验证安装**
   - 返回 GitHub Settings > Actions > Runners
   - 应该看到你的 runner 显示为 "Idle" 状态（绿色）

### 第二步: 配置环境文件

在服务器的 runner 工作目录中，需要准备后端环境配置文件。

1. **找到 Runner 工作目录**

   ```powershell
   # 通常在: C:\actions-runner\_work\game-gallery\game-gallery\backend\.env
   # 或者在第一次部署后手动创建
   ```

2. **创建 backend/.env 文件**

   在服务器上创建 `backend\.env` 文件（可以在第一次部署失败后手动创建）:

   ```env
   # Steam API Configuration
   STEAM_API_KEY=your_steam_api_key_here

   # Server Configuration
   PORT=8080
   ```

   获取 Steam API Key: https://steamcommunity.com/dev/apikey

### 第三步: 配置 IIS

1. **安装 IIS**（如果未安装）

   ```powershell
   Install-WindowsFeature -Name Web-Server -IncludeManagementTools
   ```

2. **安装 URL Rewrite 模块**

   下载并安装: [URL Rewrite Module 2.1](https://www.iis.net/downloads/microsoft/url-rewrite)

3. **配置防火墙**

   ```powershell
   # 允许 HTTP (80端口)
   New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80

   # 允许后端 API (8080端口)
   New-NetFirewallRule -DisplayName "Game Gallery API" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8080
   ```

### 第四步: 配置前端环境变量（可选）

如果需要在生产环境中配置不同的 API 地址：

在 `web/.env.production` 中设置:

```env
VITE_API_URL=http://YOUR_SERVER_IP:8080
```

### 第五步: 触发部署

完成以上配置后，有两种方式触发部署：

1. **自动部署**: 推送代码到 `main` 分支

   ```bash
   git push origin main
   ```

2. **手动部署**: 在 GitHub 仓库页面
   - 进入 **Actions** 标签页
   - 选择 **Deploy to Windows Server** workflow
   - 点击 **Run workflow**

### 第六步: 验证部署

部署完成后，访问以下地址验证：

- **前端**: `http://YOUR_SERVER_IP/`
- **后端 API**: `http://YOUR_SERVER_IP:8080/`
- **健康检查**: `http://YOUR_SERVER_IP:8080/health`

## 故障排查

### Runner 无法连接

```powershell
# 检查 runner 服务状态
Get-Service -Name "actions.runner.*"

# 查看 runner 日志
Get-Content C:\actions-runner\_diag\Runner_*.log -Tail 50
```

### Docker 构建失败

```powershell
# 切换到 Windows 容器模式
& $Env:ProgramFiles\Docker\Docker\DockerCli.exe -SwitchDaemon

# 检查 Docker 信息
docker info

# 手动测试构建
cd backend
docker build -t game-gallery-backend:test .
```

### IIS 网站无法访问

```powershell
# 检查网站状态
Import-Module WebAdministration
Get-Website -Name "GameGallery"

# 启动网站
Start-WebSite -Name "GameGallery"

# 检查应用程序池
Get-WebAppPoolState -Name "GameGallery"
```

### 环境变量未配置

如果后端容器启动失败，可能是缺少 `.env` 文件：

```powershell
# 在 runner 的工作目录中创建
cd C:\actions-runner\_work\game-gallery\game-gallery\backend
Copy-Item .env.example .env
notepad .env  # 编辑并填入 STEAM_API_KEY
```

## 高级配置

### 添加 HTTPS 支持

1. 在 IIS 中为站点绑定 SSL 证书
2. 配置 `web/.env.production`:
   ```env
   VITE_API_URL=https://YOUR_DOMAIN:8443
   ```

### 使用 Docker Compose

如果想使用 `docker-compose.windows.yml`:

```powershell
# 在 workflow 中替换部署步骤
docker-compose -f docker-compose.windows.yml down
docker-compose -f docker-compose.windows.yml build
docker-compose -f docker-compose.windows.yml up -d
```

### 配置多环境部署

可以创建多个 workflow 文件用于不同环境:

- `.github/workflows/deploy-staging.yml` - 测试环境
- `.github/workflows/deploy-production.yml` - 生产环境

通过不同的分支或标签触发不同的部署。

## 监控与日志

### 查看后端日志

```powershell
docker logs game-gallery-backend
docker logs -f game-gallery-backend  # 实时日志
```

### 查看 IIS 日志

```powershell
Get-Content C:\inetpub\logs\LogFiles\W3SVC*\*.log -Tail 50
```

### 查看 Runner 日志

```powershell
Get-Content C:\actions-runner\_diag\Worker_*.log -Tail 50
```

## 安全建议

1. **不要提交敏感信息**: 确保 `.env` 文件不在版本控制中
2. **使用 GitHub Secrets**: 如需在 workflow 中使用敏感信息，使用 GitHub Secrets
3. **限制 Runner 访问**: Self-hosted runner 应只用于受信任的仓库
4. **定期更新**: 定期更新 Runner、Docker 和系统补丁
5. **配置防火墙**: 只开放必要的端口

## 维护操作

### 更新 Runner

```powershell
cd C:\actions-runner
.\svc.cmd stop
.\svc.cmd uninstall
# 下载新版本并重新配置
.\svc.cmd install
.\svc.cmd start
```

### 清理 Docker 资源

```powershell
# 清理未使用的镜像
docker image prune -a -f

# 清理未使用的容器
docker container prune -f
```

## 参考资料

- [GitHub Self-hosted Runners 文档](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Windows Container 文档](https://learn.microsoft.com/en-us/virtualization/windowscontainers/)
- [IIS URL Rewrite 文档](https://learn.microsoft.com/en-us/iis/extensions/url-rewrite-module/)
