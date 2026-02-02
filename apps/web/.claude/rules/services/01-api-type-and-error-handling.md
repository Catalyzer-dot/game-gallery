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
