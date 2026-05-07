# Steam 认证使用指南

本文档说明如何在项目中使用 Steam 登录功能。

## 目录结构

```
src/
├── constants/
│   └── api.ts              # API 地址定义
├── services/
│   └── auth.ts             # 认证服务（底层 API 调用）
├── hooks/
│   └── useAuth.ts          # 认证 Hook（React 状态管理）
├── components/
│   ├── AuthCallback.tsx    # 登录回调处理组件
│   └── LoginButton.tsx     # 登录按钮示例
└── types.ts                # 类型定义
```

## 快速开始

### 1. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
# 后端 API 地址
VITE_API_URL=http://localhost:8080

# 生产环境
# VITE_API_URL=https://degenerates.site
```

### 2. 配置路由

在你的路由配置中添加回调路由（以 React Router 为例）：

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthCallback from '@/components/AuthCallback'
import HomePage from '@/pages/HomePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### 3. 使用认证 Hook

在组件中使用 `useAuth` Hook：

```tsx
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { isAuthenticated, user, isLoading, login, logout } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isAuthenticated && user) {
    return (
      <div>
        <p>Welcome, {user.username}!</p>
        <button onClick={logout}>Logout</button>
      </div>
    )
  }

  return <button onClick={() => login()}>Login with Steam</button>
}
```

## API 说明

### useAuth Hook

认证状态管理 Hook，提供以下属性和方法：

```typescript
interface UseAuthResult {
  isAuthenticated: boolean // 是否已登录
  user: User | null // 当前用户信息
  isLoading: boolean // 是否正在加载
  login: (returnUrl?: string) => Promise<void> // 登录方法
  logout: () => Promise<void> // 登出方法
  refreshUser: () => void // 刷新用户信息
}
```

**使用示例：**

```tsx
const { isAuthenticated, user, login, logout } = useAuth()

// 登录（可选指定回调 URL）
await login('http://localhost:3000/auth/callback')

// 登出
await logout()

// 检查登录状态
if (isAuthenticated) {
  console.log('User:', user)
}
```

### 认证服务 (auth.ts)

底层认证 API，通常不需要直接调用（通过 Hook 使用）：

```typescript
// 获取登录 URL
const loginUrl = await getLoginUrl({ returnUrl: '...' })

// 刷新 token
const newToken = await refreshToken()

// 登出
await logout()

// 检查登录状态
const authenticated = isAuthenticated()

// 获取当前用户
const user = getCurrentUser()

// 自动刷新 token（建议在应用启动时调用）
await autoRefreshToken()
```

## 登录流程

### 完整流程图

```
用户点击登录按钮
    ↓
调用 login() 方法
    ↓
获取 Steam 登录 URL (GET /api/auth/login)
    ↓
重定向到 Steam 登录页面
    ↓
用户在 Steam 完成登录
    ↓
Steam 重定向到后端 /api/auth/callback
    ↓
后端验证并返回 token 和用户信息
    ↓
前端 AuthCallback 组件处理回调
    ↓
保存 token 和用户信息到 localStorage
    ↓
跳转到主页，登录完成
```

### 代码流程

1. **用户点击登录按钮**

```tsx
<button onClick={() => login('http://localhost:3000/auth/callback')}>Login with Steam</button>
```

2. **获取登录 URL 并重定向**

```typescript
// 内部实现（在 useAuth 中）
const loginUrlValue = await getLoginUrl({ returnUrl })
window.location.href = loginUrlValue
```

3. **处理回调**

```tsx
// AuthCallback.tsx
useEffect(() => {
  // 从 URL 参数获取 token 和用户信息
  const token = urlParams.get('token')
  const userJson = urlParams.get('user')

  // 保存认证信息
  handleAuthCallback({ token, user })

  // 跳转到主页
  navigate('/')
}, [])
```

## Token 管理

### Token 存储

Token 和用户信息存储在 `localStorage` 中：

- `auth_token`: JWT token
- `auth_user`: 用户信息 JSON 字符串

### Token 自动刷新

建议在应用启动时调用 `autoRefreshToken()`：

```tsx
// App.tsx
import { useEffect } from 'react'
import { autoRefreshToken } from '@/services/auth'

function App() {
  useEffect(() => {
    // 应用启动时自动刷新 token（如果需要）
    autoRefreshToken()
  }, [])

  return <YourApp />
}
```

### Token 有效期

- 默认有效期：24 小时
- 建议刷新时机：剩余时间少于 1 小时时自动刷新
- `autoRefreshToken()` 会自动检查并刷新

## 受保护的 API 请求

使用 token 访问需要认证的 API：

```typescript
import { getToken } from '@/services/auth'

async function fetchProtectedData() {
  const token = getToken()

  if (!token) {
    console.error('Not authenticated')
    return null
  }

  try {
    const response = await fetch('/api/protected-endpoint', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      // Token 可能已过期，尝试刷新
      const newToken = await refreshToken()

      if (!newToken) {
        // 刷新失败，需要重新登录
        return null
      }

      // 使用新 token 重试
      const retryResponse = await fetch('/api/protected-endpoint', {
        headers: {
          Authorization: `Bearer ${newToken}`,
        },
      })

      return retryResponse.json()
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching protected data:', error)
    return null
  }
}
```

## 后端回调处理说明

根据 API 文档，后端回调处理有两种可能的方式：

### 方式 1: URL 参数传递（推荐）

后端在回调时通过 URL 参数返回 token 和用户信息：

```
http://localhost:3000/auth/callback?token=xxx&user={"id":"...","username":"..."}
```

前端 `AuthCallback` 组件已实现此方式。

### 方式 2: JSON 响应

后端直接返回 JSON 响应。这种情况下，需要修改 `AuthCallback` 组件：

```tsx
useEffect(() => {
  const processCallback = async () => {
    // 将当前 URL 的查询参数发送到后端
    const response = await fetch(`/api/auth/callback${window.location.search}`)

    if (!response.ok) {
      setError('Authentication failed')
      return
    }

    const data = await response.json()
    handleAuthCallback(data.data)
    navigate('/')
  }

  processCallback()
}, [])
```

请根据实际后端实现选择对应的方式。

## 错误处理

所有认证方法都遵循项目规范：

- 内部捕获并处理异常
- 返回 `T | null`（成功返回数据，失败返回 `null`）
- 不抛出异常给调用方
- 使用 `console.error` 记录错误日志

示例：

```tsx
const loginUrl = await getLoginUrl()

if (!loginUrl) {
  // 处理获取登录 URL 失败的情况
  alert('Failed to get login URL. Please try again.')
  return
}

// 继续处理成功的情况
window.location.href = loginUrl
```

## 类型定义

所有认证相关的类型都在 `types.ts` 中定义：

```typescript
interface User {
  id: string
  steam_id: string
  username: string
  avatar_url: string
  profile_url: string
  is_active: boolean
  last_login_at: string
  created_at: string
  updated_at: string
}

interface AuthResponse {
  user: User
  token: string
}
```

## 注意事项

1. **环境变量**：确保正确配置 `VITE_API_URL`
2. **回调 URL**：登录时传递的 `returnUrl` 应该是前端的回调页面地址
3. **CORS**：后端应该正确配置 CORS，允许前端域名访问
4. **Token 刷新**：建议在应用启动和定期调用 `autoRefreshToken()`
5. **错误处理**：所有方法返回 `null` 时表示失败，需要适当处理

## 完整示例

查看以下文件获取完整示例：

- `components/LoginButton.tsx` - 登录按钮示例
- `components/AuthCallback.tsx` - 回调处理示例
- `hooks/useAuth.ts` - Hook 实现
- `services/auth.ts` - 认证服务实现
