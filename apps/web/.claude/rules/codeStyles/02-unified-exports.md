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
