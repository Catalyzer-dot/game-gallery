# 代码编写规范

本文档定义了项目中代码编写的通用规范，确保代码的可读性和可维护性。

## 规则 1: 使用 Happy Path 模式编写条件判断

### 规则说明

在编写条件判断逻辑时，应优先使用 Happy Path（快乐路径）模式，即先处理异常和边界情况并尽早返回，让主要业务逻辑保持在最外层，减少代码嵌套层级。

1. **基本原则**
   - 优先处理错误情况、边界情况、异常情况
   - 使用 early return（尽早返回）减少嵌套
   - 将主要业务逻辑（happy path）保持在最外层
   - 避免深层嵌套的 if-else 结构

2. **适用场景**
   - 函数参数校验
   - 前置条件检查
   - 错误处理
   - 权限验证
   - 数据有效性检查

3. **优势**
   - 提高代码可读性
   - 减少认知负担
   - 降低嵌套层级
   - 更容易发现和处理边界情况

### 代码示例

#### ✅ 正确示例（Happy Path）

```typescript
// 示例 1: 参数校验和错误处理
async function processUser(userId: string): Promise<User | null> {
  // 先处理参数无效的情况
  if (!userId || userId.trim() === '') {
    console.error('Invalid user ID')
    return null
  }

  // 先处理数据获取失败的情况
  const user = await fetchUser(userId)
  if (!user) {
    console.error('User not found')
    return null
  }

  // 先处理权限不足的情况
  if (!user.isActive) {
    console.error('User is not active')
    return null
  }

  // 主要业务逻辑保持在最外层（happy path）
  user.lastAccessTime = new Date()
  await saveUser(user)
  return user
}

// 示例 2: 数组处理
function filterValidGames(games: Game[]): Game[] {
  // 先处理空数组的情况
  if (games.length === 0) {
    return []
  }

  // 主要业务逻辑
  return games.filter((game) => {
    // 过滤器内部也使用 early return
    if (!game.name) return false
    if (!game.steamUrl) return false
    if (game.status === 'deleted') return false

    return true
  })
}

// 示例 3: 嵌套对象访问
function getGameRating(game: Game): number | null {
  // 先处理游戏对象不存在的情况
  if (!game) {
    return null
  }

  // 先处理评分数据不存在的情况
  if (!game.positivePercentage) {
    return null
  }

  // 先处理评分无效的情况
  if (game.positivePercentage < 0 || game.positivePercentage > 100) {
    console.warn(`Invalid rating for game ${game.name}`)
    return null
  }

  // 主要业务逻辑
  return game.positivePercentage
}

// 示例 4: 多条件检查
async function addGame(params: AddGameParams): Promise<boolean> {
  // 参数校验
  if (!params.name) {
    showError('游戏名称不能为空')
    return false
  }

  if (!params.steamUrl) {
    showError('Steam 链接不能为空')
    return false
  }

  // 业务规则检查
  const existingGame = await findGameByName(params.name)
  if (existingGame) {
    showError('游戏已存在')
    return false
  }

  // 权限检查
  const hasPermission = await checkPermission('add_game')
  if (!hasPermission) {
    showError('没有权限添加游戏')
    return false
  }

  // 主要业务逻辑（happy path）
  const game = createGame(params)
  await saveGame(game)
  showSuccess('游戏添加成功')
  return true
}
```

#### ❌ 错误示例（深层嵌套）

```typescript
// ❌ 示例 1: 深层嵌套的 if-else
async function processUser(userId: string): Promise<User | null> {
  if (userId && userId.trim() !== '') {
    const user = await fetchUser(userId)
    if (user) {
      if (user.isActive) {
        // 主要业务逻辑深埋在嵌套中
        user.lastAccessTime = new Date()
        await saveUser(user)
        return user
      } else {
        console.error('User is not active')
        return null
      }
    } else {
      console.error('User not found')
      return null
    }
  } else {
    console.error('Invalid user ID')
    return null
  }
}

// ❌ 示例 2: 过度使用 else
function getGameRating(game: Game): number | null {
  if (game) {
    if (game.positivePercentage) {
      if (game.positivePercentage >= 0 && game.positivePercentage <= 100) {
        return game.positivePercentage
      } else {
        console.warn(`Invalid rating for game ${game.name}`)
        return null
      }
    } else {
      return null
    }
  } else {
    return null
  }
}

// ❌ 示例 3: 将错误处理放在 else 中
async function addGame(params: AddGameParams): Promise<boolean> {
  if (params.name) {
    if (params.steamUrl) {
      const existingGame = await findGameByName(params.name)
      if (!existingGame) {
        const hasPermission = await checkPermission('add_game')
        if (hasPermission) {
          // 主要逻辑深埋在第4层嵌套中
          const game = createGame(params)
          await saveGame(game)
          showSuccess('游戏添加成功')
          return true
        } else {
          showError('没有权限添加游戏')
          return false
        }
      } else {
        showError('游戏已存在')
        return false
      }
    } else {
      showError('Steam 链接不能为空')
      return false
    }
  } else {
    showError('游戏名称不能为空')
    return false
  }
}
```

### 实现要点

1. **使用 early return**

   ```typescript
   // ✅ 好的做法
   function process(value: string | null): string {
     if (!value) return ''
     if (value.length === 0) return ''

     return value.toUpperCase()
   }

   // ❌ 避免这样
   function process(value: string | null): string {
     if (value) {
       if (value.length > 0) {
         return value.toUpperCase()
       }
     }
     return ''
   }
   ```

2. **避免不必要的 else**

   ```typescript
   // ✅ 好的做法
   function getStatus(count: number): string {
     if (count === 0) return 'empty'
     if (count < 10) return 'low'

     return 'normal'
   }

   // ❌ 避免这样
   function getStatus(count: number): string {
     if (count === 0) {
       return 'empty'
     } else {
       if (count < 10) {
         return 'low'
       } else {
         return 'normal'
       }
     }
   }
   ```

3. **先处理否定条件**

   ```typescript
   // ✅ 好的做法
   function validateGame(game: Game): boolean {
     if (!game) return false
     if (!game.name) return false
     if (!game.steamUrl) return false

     return true
   }

   // ❌ 避免这样
   function validateGame(game: Game): boolean {
     if (game) {
       if (game.name) {
         if (game.steamUrl) {
           return true
         }
       }
     }
     return false
   }
   ```

4. **合理使用逻辑运算符**

   ```typescript
   // ✅ 好的做法 - 简单条件可以合并
   function isEmpty(value: string | null | undefined): boolean {
     if (!value || value.trim() === '') return true
     return false
   }

   // 但对于复杂条件，优先清晰度
   function isValidGame(game: Game): boolean {
     if (!game) return false
     if (!game.name || game.name.trim() === '') return false
     if (!game.steamUrl) return false
     if (game.status === 'deleted') return false

     return true
   }
   ```

### 适用场景

此规范适用于：

- 所有函数和方法的条件判断
- 错误处理和参数校验
- 权限和前置条件检查
- React 组件中的条件渲染

### 特殊情况

某些情况下可以不遵循此规则：

1. **三元运算符适用的简单情况**

   ```typescript
   const message = isSuccess ? '成功' : '失败'
   ```

2. **React 组件的条件渲染**

   ```typescript
   // 简单的条件渲染可以这样写
   {isLoading && <Spinner />}
   {error && <ErrorMessage error={error} />}
   {data && <DataDisplay data={data} />}
   ```

3. **策略模式等设计模式**
   ```typescript
   // 使用对象映射代替多个 if-else
   const statusMessages = {
     playing: '正在玩',
     queueing: '排队中',
     completion: '已完成',
   }
   const message = statusMessages[status] || '未知状态'
   ```

### 注意事项

- Happy Path 的目标是提高可读性，不要为了遵循规则而过度拆分简单逻辑
- 对于只有 2-3 行的简单函数，可以根据实际情况选择更自然的写法
- 在团队 code review 中，关注代码的整体可读性，而不是机械地执行规则

---

## 规则 2: 统一在文件末尾导出

### 规则说明

在 TypeScript/JavaScript 文件中，所有的 `export` 语句应该统一放在文件的末尾，而不是在定义时直接导出。这样可以让代码结构更清晰，方便查看模块的公共接口。

1. **基本原则**
   - 在文件中定义时不使用 `export` 关键字（包括类型、接口、枚举等）
   - 在文件末尾统一使用 `export { ... }` 或 `export type { ... }` 导出
   - 默认导出使用 `export default` 放在末尾
   - 所有导出（包括类型）都应该集中在文件末尾

2. **优势**
   - 一眼就能看到文件导出了哪些内容（包括类型和实现）
   - 更容易管理和维护导出列表
   - 方便重命名导出（使用 `as` 语法）
   - 减少代码修改时的错误
   - 便于区分内部类型和公开类型

3. **适用场景**
   - 所有工具函数、业务逻辑函数
   - 类、常量、变量
   - React 组件
   - Service 类和单例
   - 类型定义、接口、枚举

### 代码示例

#### ✅ 正确示例（统一末尾导出）

```typescript
// services/steam.ts

// ==================== Types ====================
interface SearchGamesRequest {
  query: string
}

interface SteamGame {
  id: number
  name: string
  steamUrl: string
}

interface GameReviewsInfo {
  positivePercentage: number | null
  totalReviews: number | null
}

// ==================== Constants ====================
const RETRY_TIMES = 3
const TIMEOUT = 5000

// ==================== Helper Functions ====================
function validateQuery(query: string): boolean {
  return query.trim().length > 0
}

function parseGameData(data: any): SteamGame {
  return {
    id: data.id,
    name: data.name,
    steamUrl: data.url,
  }
}

// ==================== Main Class ====================
class SteamService {
  async search(params: SearchGamesRequest): Promise<SteamGame[] | null> {
    if (!validateQuery(params.query)) {
      return null
    }
    // ... 实现代码
  }
}

// ==================== Service Instance ====================
const steamService = new SteamService()

// ==================== Exports ====================
// 导出类型
export type { SearchGamesRequest, SteamGame, GameReviewsInfo }

// 导出实现
export { RETRY_TIMES, TIMEOUT, validateQuery, SteamService, steamService }
```

```typescript
// utils/formatters.ts

// ==================== Helper Functions ====================
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

function formatNumber(num: number): string {
  return num.toLocaleString()
}

// 私有函数（不导出）
function privateHelper(value: string): string {
  return value.trim()
}

// ==================== Exports ====================
export { formatDate, formatPercentage, formatNumber }
```

```typescript
// components/GameCard.tsx

// ==================== Types ====================
interface GameCardProps {
  name: string
  coverImage: string
  onPlay: () => void
}

// ==================== Component ====================
function GameCard({ name, coverImage, onPlay }: GameCardProps) {
  return (
    <div className="game-card">
      <img src={coverImage} alt={name} />
      <h3>{name}</h3>
      <button onClick={onPlay}>Play</button>
    </div>
  )
}

// ==================== Exports ====================
export type { GameCardProps }
export default GameCard
```

```typescript
// hooks/useGameSearch.ts

// ==================== Types ====================
interface SearchResult {
  id: string
  name: string
  type: 'game' | 'dlc'
}

// ==================== Hook ====================
function useGameSearch(games: Game[], searchTerm: string): SearchResult[] {
  return useMemo(() => {
    if (!searchTerm) return []

    return games
      .filter((game) => game.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((game) => ({
        id: game.id,
        name: game.name,
        type: 'game' as const,
      }))
  }, [games, searchTerm])
}

// ==================== Exports ====================
export type { SearchResult }
export { useGameSearch }
```

#### ❌ 错误示例（分散导出）

```typescript
// ❌ 错误示例 1: 在定义时导出（包括类型）
export interface SearchGamesRequest {
  query: string
}

export type SteamGame = {
  id: number
  name: string
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

export const RETRY_TIMES = 3

export class SteamService {
  async search(params: SearchGamesRequest): Promise<SteamGame[] | null> {
    // ...
  }
}

export const steamService = new SteamService()
```

```typescript
// ❌ 错误示例 2: 导出分散在文件各处
const TIMEOUT = 5000

export function validateQuery(query: string): boolean {
  return query.trim().length > 0
}

function parseGameData(data: any): SteamGame {
  return {
    /* ... */
  }
}

export class SteamService {
  // ...
}

export { TIMEOUT }

const steamService = new SteamService()

export { steamService }
```

```typescript
// ❌ 错误示例 3: React 组件在定义时导出
export default function GameCard({ name }: GameCardProps) {
  return <div>{name}</div>
}

// 后面还有其他代码...
```

### 实现要点

1. **文件结构组织**

   ```typescript
   // 1. Import 语句
   import { something } from './somewhere'

   // 2. Types（定义时不导出）
   interface MyType {
     id: string
     name: string
   }

   type MyStatus = 'active' | 'inactive'

   // 3. Constants
   const MY_CONSTANT = 'value'

   // 4. Helper Functions
   function helperFunction() {}

   // 5. Main Logic
   class MyClass {}

   // 6. Exports（统一在末尾，包括类型）
   export type { MyType, MyStatus }
   export { MY_CONSTANT, helperFunction, MyClass }
   export default MyClass
   ```

2. **使用 `as` 重命名导出**

   ```typescript
   function internalGameService() {
     // ...
   }

   const service = new GameService()

   // 导出时重命名
   export { internalGameService as gameService, service as default }
   ```

3. **组合导出**

   ```typescript
   // 建议按类别分组导出，类型和实现分开

   // 导出类型（使用 export type）
   export type { SearchGamesRequest, SteamGame, GameReviewsInfo }

   // 导出实现
   export {
     // Constants
     RETRY_TIMES,
     TIMEOUT,
     // Functions
     validateQuery,
     parseGameData,
     // Classes
     SteamService,
     // Instance
     steamService,
   }
   ```

4. **默认导出 + 命名导出**

   ```typescript
   interface GameCardProps {
     name: string
     coverImage: string
   }

   function GameCard(props: GameCardProps) {
     // ...
   }

   function GameCardSkeleton() {
     // ...
   }

   // 同时支持类型导出、命名导出和默认导出
   export type { GameCardProps }
   export { GameCardSkeleton }
   export default GameCard
   ```

### 特殊情况

**Re-export（转发导出）**

这是唯一的例外情况，用于聚合和重新导出其他模块的内容：

```typescript
// index.ts - 聚合导出文件
export { SteamService, steamService } from './steam'
export { GitHubService, githubService } from './github'
export type { Game, User, GameStatus } from './types'
export * from './constants'
```

**纯类型定义文件**

即使是纯类型文件，也应该统一在末尾导出：

```typescript
// types.ts - 类型定义文件

interface Game {
  id: string
  name: string
  status: GameStatus
}

interface User {
  id: string
  username: string
  avatar: string
}

type GameStatus = 'playing' | 'queueing' | 'completion'

enum SortOrder {
  Ascending = 'asc',
  Descending = 'desc',
}

// ==================== Exports ====================
export type { Game, User, GameStatus, SortOrder }
```

### 适用场景

**此规范适用于所有 `.ts` 和 `.tsx` 文件**，包括但不限于：

- **Service 文件**（如 `services/steam.ts`、`services/github.ts`）
- **工具函数文件**（如 `utils/formatters.ts`、`helpers/validators.ts`）
- **React 组件文件**（如 `components/GameCard.tsx`）
- **自定义 Hooks**（如 `hooks/useGameSearch.ts`）
- **类型定义文件**（如 `types.ts`、`types/game.ts`）
- **常量定义文件**（如 `constants/api.ts`、`constants/config.ts`）
- **类定义文件**（如 `models/Game.ts`）

**唯一例外：** Re-export 文件（如 `index.ts`）用于聚合导出

### 注意事项

- **严格执行**：所有 `.ts` 和 `.tsx` 文件都应该遵循此规范，无论文件大小或复杂度
- **类型导出**：使用 `export type { ... }` 导出类型，而非 `export { ... }`，这样可以明确区分类型导出和值导出
- **一致性优先**：在团队中保持一致性比个人偏好更重要
- **重构策略**：
  - 新文件必须严格遵循此规范
  - 修改旧文件时，顺便将其重构为末尾导出
  - 可以专门安排时间批量重构旧代码
- **IDE 支持**：大多数 IDE 在重构导出时会自动更新所有引用，可以放心重构

---

## 规则更新日志

- 2026-02-02: 添加规则 1 - 使用 Happy Path 模式编写条件判断
- 2026-02-02: 添加规则 2 - 统一在文件末尾导出
- 2026-02-02: 更新规则 2 - 类型定义也统一在末尾导出，适用于所有 .ts 和 .tsx 文件
