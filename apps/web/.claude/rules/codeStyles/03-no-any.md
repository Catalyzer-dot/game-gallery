## 规则 3: 禁止使用 any 类型

### 规则说明

在 TypeScript 项目中，严格禁止使用 `any` 类型。`any` 会破坏 TypeScript 的类型安全性，导致潜在的运行时错误。

1. **基本原则**
   - 全局禁止使用 `any` 类型
   - 使用具体的类型定义或类型推断
   - 对于未知类型使用 `unknown`
   - 对于动态属性使用泛型或联合类型

2. **适用场景**
   - 所有 .ts 和 .tsx 文件
   - 函数参数、返回值
   - 变量声明
   - 对象属性
   - 泛型参数

3. **替代方案**
   - 使用 `unknown` 替代 `any`（需要类型检查后才能使用）
   - 使用泛型 `<T>` 处理动态类型
   - 使用联合类型 `string | number | boolean`
   - 使用 `Record<string, unknown>` 处理动态对象
   - 使用类型断言（谨慎使用）

### 代码示例

#### ✅ 正确示例

```typescript
// 示例 1: 使用 unknown 替代 any
function parseJSON(jsonString: string): unknown {
  return JSON.parse(jsonString)
}

// 使用时需要类型检查
const result = parseJSON('{"name":"test"}')
if (typeof result === 'object' && result !== null && 'name' in result) {
  console.log((result as { name: string }).name)
}

// 示例 2: 使用泛型
function getFirstItem<T>(items: T[]): T | null {
  if (items.length === 0) {
    return null
  }
  return items[0]
}

const firstGame = getFirstItem<Game>(games)

// 示例 3: 使用联合类型
type ApiResponse = string | number | boolean | null

function processResponse(response: ApiResponse): void {
  if (typeof response === 'string') {
    console.log('String response:', response)
  } else if (typeof response === 'number') {
    console.log('Number response:', response)
  }
  // ...
}

// 示例 4: 使用 Record 处理动态对象
interface GameMetadata extends Record<string, unknown> {
  id: string
  name: string
  // 其他已知属性
}

function processMetadata(metadata: GameMetadata): void {
  console.log(metadata.id)
  console.log(metadata.name)

  // 访问动态属性时需要类型检查
  if ('customField' in metadata && typeof metadata.customField === 'string') {
    console.log(metadata.customField)
  }
}

// 示例 5: API 响应处理
interface UserResponse {
  id: string
  name: string
  email: string
}

async function fetchUser(userId: string): Promise<UserResponse | null> {
  try {
    const response = await fetch(`/api/users/${userId}`)
    if (!response.ok) return null

    // 使用类型断言而非 any
    const data = (await response.json()) as UserResponse
    return data
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return null
  }
}

// 示例 6: 事件处理
function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
  const value = event.target.value
  console.log(value)
}

// 示例 7: 第三方库类型不完整时，使用具体类型
interface SteamApiResponse {
  items: Array<{
    id: number
    name: string
    type: string
  }>
}

async function searchSteam(query: string): Promise<SteamApiResponse | null> {
  try {
    const response = await fetch(`/api/search?q=${query}`)
    const data = (await response.json()) as SteamApiResponse
    return data
  } catch (error) {
    return null
  }
}
```

#### ❌ 错误示例

```typescript
// ❌ 错误 1: 直接使用 any
function parseJSON(jsonString: string): any {
  return JSON.parse(jsonString)
}

// ❌ 错误 2: 参数使用 any
function processData(data: any): void {
  console.log(data.name)
}

// ❌ 错误 3: 数组使用 any
const items: any[] = []
items.push({ id: 1 })
items.push('string')

// ❌ 错误 4: 对象使用 any
const config: any = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
}

// ❌ 错误 5: 忽略 ESLint 警告
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function badFunction(param: any): any {
  return param
}

// ❌ 错误 6: API 响应使用 any
async function fetchUser(userId: string): Promise<any> {
  const response = await fetch(`/api/users/${userId}`)
  return response.json()
}

// ❌ 错误 7: 事件处理使用 any
function handleClick(event: any): void {
  event.preventDefault()
}
```

### 实现要点

1. **使用 unknown 代替 any**

   ```typescript
   // ✅ 使用 unknown，强制类型检查
   function processValue(value: unknown): void {
     // 必须先检查类型
     if (typeof value === 'string') {
       console.log(value.toUpperCase())
     }
   }

   // ❌ 使用 any，跳过类型检查
   function processValue(value: any): void {
     console.log(value.toUpperCase()) // 可能运行时报错
   }
   ```

2. **定义明确的接口**

   ```typescript
   // ✅ 定义明确的接口
   interface ApiResponse {
     code: number
     message: string
     data: {
       id: string
       name: string
     }
   }

   // ❌ 使用 any
   let response: any
   ```

3. **使用泛型提高复用性**

   ```typescript
   // ✅ 使用泛型
   function wrapResponse<T>(
     data: T,
     success: boolean
   ): {
     success: boolean
     data: T
   } {
     return { success, data }
   }

   // ❌ 使用 any
   function wrapResponse(data: any, success: boolean): any {
     return { success, data }
   }
   ```

4. **第三方库类型缺失时**

   ```typescript
   // ✅ 方案 1: 定义类型
   interface ThirdPartyResponse {
     result: string
     code: number
   }

   const data = externalLib.getData() as ThirdPartyResponse

   // ✅ 方案 2: 使用 unknown 并检查
   const data = externalLib.getData() as unknown

   if (typeof data === 'object' && data !== null && 'result' in data) {
     // 安全使用
   }

   // ❌ 使用 any
   const data = externalLib.getData() as any
   ```

5. **处理动态 JSON 数据**

   ```typescript
   // ✅ 定义接口
   interface GameData {
     id: string
     name: string
     [key: string]: unknown // 允许额外的动态属性
   }

   const data: GameData = JSON.parse(jsonString)

   // ❌ 使用 any
   const data: any = JSON.parse(jsonString)
   ```

### 适用场景

此规范适用于：

- **所有 TypeScript 文件**（.ts、.tsx）
- 函数参数和返回值
- 变量声明
- 类型断言
- 泛型约束
- API 响应处理

### 例外情况

**极少数情况下**可以使用 `any`，但必须有充分理由并添加详细注释：

```typescript
// ✅ 例外 1: 已知的第三方库类型定义错误（临时方案）
/**
 * 注意：老版本的 lodash 类型定义有问题
 * TODO: 升级到新版本后移除 any
 * Issue: #123
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const result = _.someMethod(data) as any

// ✅ 例外 2: 复杂的递归类型（临时方案）
/**
 * 注意：这是一个递归树结构，暂时使用 any
 * TODO: 定义正确的递归类型
 */
type TreeNode = {
  value: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any[]
}
```

**即使是例外情况，也必须：**

- 添加详细的注释说明原因
- 创建 TODO 或 Issue 跟踪
- 使用 ESLint 忽略注释
- 在 code review 中特别说明

### TypeScript 配置

确保在 `tsconfig.json` 中启用严格模式：

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true
  }
}
```

### ESLint 配置

在 `eslint.config.js` 中启用相关规则：

```javascript
export default {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error', // 禁止显式 any
    '@typescript-eslint/no-unsafe-assignment': 'error', // 禁止 any 赋值
    '@typescript-eslint/no-unsafe-member-access': 'error', // 禁止访问 any 成员
    '@typescript-eslint/no-unsafe-call': 'error', // 禁止调用 any
    '@typescript-eslint/no-unsafe-return': 'error', // 禁止返回 any
  },
}
```

### 迁移建议

对于现有代码中的 `any`，建议按以下步骤迁移：

1. **识别 any 使用**

   ```bash
   # 查找所有使用 any 的地方
   grep -r ": any" src/
   ```

2. **分类处理**
   - 简单类型 → 直接替换为具体类型
   - 复杂对象 → 定义 interface
   - 未知类型 → 使用 `unknown`
   - 泛型场景 → 使用泛型 `<T>`

3. **逐步重构**
   - 优先处理核心业务代码
   - 从叶子节点开始（被调用的函数）
   - 逐步向上传递类型信息

---

## 规则更新日志

- 2026-02-02: 创建规则 - 禁止使用 any 类型
