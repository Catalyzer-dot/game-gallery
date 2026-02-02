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
