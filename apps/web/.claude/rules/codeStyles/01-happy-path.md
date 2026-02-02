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
