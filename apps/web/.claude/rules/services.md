# API Service 开发规范

本文档定义了项目中 API 请求方法的开发规范，确保统一的错误处理和类型安全。

## 规则 1: API 请求类型定义与错误处理

### 规则说明

在编写 API 请求方法时，必须遵循以下规范：

1. **类型定义要求**
   - 必须明确定义请求参数类型（Request Type）
   - 必须明确定义返回数据类型（Response Type）
   - 使用 TypeScript 接口或类型别名进行类型声明

2. **错误处理规范**
   - **非业务异常**（网络错误、服务器错误、超时等）：捕获后返回 `null`，不抛出异常
   - **业务异常**（如数据不存在、权限不足等）：返回对应的业务数据或 `null`
   - 所有 API 方法的返回类型为 `Promise<T | null>`，其中 `T` 为业务数据类型

3. **调用方式要求**
   - 外部调用 API 方法时，**不使用 try-catch**
   - 通过判断返回值是否为 `null` 来处理错误情况
   - API 方法内部已统一处理异常，外部只需关注业务逻辑

### 代码示例

#### ✅ 正确示例

```typescript
// 1. 定义请求和响应类型
interface UserRequest {
  userId: string
}

interface UserResponse {
  id: string
  name: string
  email: string
}

// 2. API 方法实现 - 内部处理所有异常
async function getUser(params: UserRequest): Promise<UserResponse | null> {
  try {
    const response = await fetch(`/api/users/${params.userId}`)

    // 非业务异常：网络错误、服务器错误等
    if (!response.ok) {
      console.error(`Failed to fetch user: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()

    // 业务异常：用户不存在
    if (!data || !data.id) {
      console.warn('User not found')
      return null
    }

    return data as UserResponse
  } catch (error) {
    // 捕获所有异常（网络错误、解析错误等）
    console.error('Error fetching user:', error)
    return null
  }
}

// 3. 调用方式 - 不使用 try-catch
async function displayUserInfo(userId: string) {
  const user = await getUser({ userId })

  if (user === null) {
    // 统一处理错误情况
    showErrorMessage('获取用户信息失败')
    return
  }

  // 处理正常业务逻辑
  console.log(`User: ${user.name} (${user.email})`)
}
```

#### ❌ 错误示例

```typescript
// ❌ 错误 1: 没有定义类型
async function getUser(userId) {
  const response = await fetch(`/api/users/${userId}`)
  return response.json()
}

// ❌ 错误 2: 抛出异常给调用方
async function getUser(userId: string): Promise<UserResponse> {
  const response = await fetch(`/api/users/${userId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch user') // ❌ 不要抛出异常
  }

  return response.json()
}

// ❌ 错误 3: 调用方使用 try-catch
async function displayUserInfo(userId: string) {
  try {
    const user = await getUser(userId) // ❌ 不需要 try-catch
    console.log(user.name)
  } catch (error) {
    console.error(error)
  }
}
```

### 实现要点

1. **统一错误日志**
   - 在 API 方法内部使用 `console.error` 记录错误
   - 包含足够的上下文信息便于调试

2. **返回 null 的时机**
   - 网络请求失败（网络断开、超时等）
   - HTTP 状态码不是 2xx（服务器错误、客户端错误等）
   - 响应数据解析失败
   - 业务数据不符合预期（如必需字段缺失）

3. **类型安全**
   - 使用 TypeScript 严格模式
   - 避免使用 `any` 类型
   - 为所有 API 响应定义明确的接口

### 适用场景

此规范适用于：

- 所有外部 API 请求（RESTful API、GraphQL 等）
- 第三方服务调用
- 内部微服务通信

### 注意事项

- 对于需要区分不同错误类型的场景，可以返回更丰富的数据结构：

  ```typescript
  interface ApiResult<T> {
    data: T | null
    error: {
      code: string
      message: string
    } | null
  }
  ```

- 对于需要用户明确感知的错误（如表单验证错误），可以通过返回值中的错误信息传递：
  ```typescript
  interface ValidationResult {
    success: boolean
    errors: string[]
    data?: UserData
  }
  ```

---

## 规则 2: API 地址统一管理

### 规则说明

所有 API 请求地址必须在 `/constants/api.ts` 文件中统一定义和管理，不允许在业务代码中硬编码 API 地址。

1. **统一定义要求**
   - 所有 API 地址必须在 `constants/api.ts` 中定义
   - 每个 API 地址上方必须使用多行注释说明其用途
   - 使用语义化的常量名称（全大写，下划线分隔）
   - 按功能模块分组管理

2. **使用方式要求**
   - 在需要使用 API 地址的地方，从 `constants/api.ts` 导入
   - 不允许在代码中直接写 URL 字符串
   - 不允许在单个文件中定义私有的 API 常量

3. **注释规范**
   - 使用多行注释 `/** */` 格式
   - 说明 API 的用途、参数要求、返回值类型
   - 如有特殊说明（如需要认证、有速率限制等），需注明

### 代码示例

#### ✅ 正确示例

```typescript
// constants/api.ts

/**
 * Steam Store 搜索 API
 * 用于搜索 Steam 商店中的游戏
 * @param term - 搜索关键词（需要 URL 编码）
 * @param l - 语言代码（如 schinese）
 * @param cc - 国家/地区代码（如 CN）
 * @returns 返回游戏搜索结果列表
 */
export const STEAM_SEARCH_API = 'https://store.steampowered.com/api/storesearch/'

/**
 * Steam App 详情 API
 * 用于获取指定游戏的详细信息
 * @param appids - 游戏 ID
 * @param l - 语言代码
 * @param cc - 国家/地区代码
 * @returns 返回游戏详细信息
 */
export const STEAM_APP_DETAILS_API = 'https://store.steampowered.com/api/appdetails'

/**
 * Steam 评论统计 API
 * 用于获取游戏的评论统计数据
 * @param appId - 游戏 ID（需要拼接到 URL 中）
 * @note 该 API 无需认证，但有速率限制
 */
export const STEAM_REVIEWS_API = 'https://store.steampowered.com/appreviews'

/**
 * CORS 代理列表
 * 用于解决跨域请求问题
 * @note 按优先级排序，失败时自动切换到下一个
 */
export const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
]
```

```typescript
// services/steam.ts

import {
  STEAM_SEARCH_API,
  STEAM_APP_DETAILS_API,
  STEAM_REVIEWS_API,
  CORS_PROXIES,
} from '../constants/api'

export class SteamService {
  async search(params: SearchGamesRequest): Promise<SteamGame[] | null> {
    const { query } = params

    // ✅ 使用从 constants 导入的 API 地址
    const searchUrl = `${STEAM_SEARCH_API}?term=${encodeURIComponent(query)}&l=schinese&cc=CN`

    // ... 实现代码
  }

  async getGameDetails(params: GetGameDetailsRequest): Promise<SteamAppDetailsData | null> {
    const { appId } = params

    // ✅ 使用从 constants 导入的 API 地址
    const detailsUrl = `${STEAM_APP_DETAILS_API}?appids=${appId}&l=schinese&cc=CN`

    // ... 实现代码
  }
}
```

#### ❌ 错误示例

```typescript
// services/steam.ts

// ❌ 错误 1: 在文件顶部定义私有常量
const STEAM_SEARCH_API = 'https://store.steampowered.com/api/storesearch/'

export class SteamService {
  async search(params: SearchGamesRequest): Promise<SteamGame[] | null> {
    const { query } = params

    // ❌ 错误 2: 在代码中硬编码 URL
    const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${query}`

    // ... 实现代码
  }

  async getGameDetails(params: GetGameDetailsRequest): Promise<SteamAppDetailsData | null> {
    const { appId } = params

    // ❌ 错误 3: 在方法内部定义 URL
    const API_BASE = 'https://store.steampowered.com/api'
    const detailsUrl = `${API_BASE}/appdetails?appids=${appId}`

    // ... 实现代码
  }
}
```

```typescript
// constants/api.ts

// ❌ 错误 4: 没有注释说明 API 用途
export const STEAM_SEARCH_API = 'https://store.steampowered.com/api/storesearch/'

// ❌ 错误 5: 使用单行注释
// Steam App 详情 API
export const STEAM_APP_DETAILS_API = 'https://store.steampowered.com/api/appdetails'
```

### 实现要点

1. **分组管理**
   - 按功能模块分组（如 Steam API、GitHub API 等）
   - 使用注释分隔不同的模块
   - 相关的 API 放在一起

2. **命名规范**
   - 使用全大写 + 下划线的常量命名风格
   - 命名应清晰表达 API 的用途
   - 避免使用缩写，除非是广为人知的（如 API、URL）

3. **注释内容**
   - 说明 API 的主要用途
   - 列出重要的查询参数或路径参数
   - 说明返回值类型或数据结构
   - 标注特殊要求（认证、速率限制、CORS 等）

4. **目录结构**
   ```
   src/
   ├── constants/
   │   └── api.ts         # API 地址统一定义
   ├── services/
   │   ├── steam.ts       # 导入并使用 API 地址
   │   └── github.ts      # 导入并使用 API 地址
   ```

### 适用场景

此规范适用于：

- 所有外部 API 请求地址
- 第三方服务的端点 URL
- CORS 代理地址
- WebSocket 连接地址

### 注意事项

- 如果项目使用环境变量配置不同环境的 API 地址，可以在 `constants/api.ts` 中统一处理：

  ```typescript
  /**
   * API 基础地址
   * 根据环境变量自动选择正确的 API 地址
   */
  export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.example.com'
  ```

- 对于需要动态拼接的 API，可以提供辅助函数：
  ```typescript
  /**
   * 获取用户详情 API 地址
   * @param userId - 用户 ID
   * @returns 完整的 API 地址
   */
  export const getUserApiUrl = (userId: string) => `${API_BASE_URL}/users/${userId}`
  ```

---

## 规则更新日志

- 2026-02-02: 添加规则 1 - API 请求类型定义与错误处理
- 2026-02-02: 添加规则 2 - API 地址统一管理
