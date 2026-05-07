/**
 * 认证 Hook
 * 提供认证状态管理和操作方法
 */

import { useState, useEffect, useCallback } from 'react'
import {
  login as loginService,
  register as registerService,
  logout as logoutService,
  isAuthenticated,
  getCurrentUser as getCurrentUserService,
} from '@/services/auth'
import type { AuthActionResult, RegisterRequest, User } from '@/types'

// ==================== Types ====================

interface UseAuthResult {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  login: (account: string, password: string) => Promise<AuthActionResult>
  register: (params: RegisterRequest) => Promise<AuthActionResult>
  logout: () => Promise<void>
  refreshUser: () => void
}

// ==================== Hook ====================

function useAuth(): UseAuthResult {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [authenticated, setAuthenticated] = useState(false)

  /**
   * 刷新用户信息
   */
  const refreshUser = useCallback(() => {
    const currentUser = getCurrentUserService()
    setUser(currentUser)
    setAuthenticated(isAuthenticated())
  }, [])

  /**
   * 初始化认证状态
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: initialize auth state on mount
    refreshUser()
    setIsLoading(false)
  }, [refreshUser])

  /**
   * 登录 - 使用用户名和密码
   * Session Token 会通过 Cookie 自动管理
   */
  const login = useCallback(
    async (account: string, password: string): Promise<AuthActionResult> => {
      setIsLoading(true)

      const result = await loginService({ account, password })

      if (!result.user) {
        setIsLoading(false)
        return result
      }

      setUser(result.user)
      setAuthenticated(true)
      setIsLoading(false)
      return result
    },
    []
  )

  /**
   * 注册并自动登录
   */
  const register = useCallback(async (params: RegisterRequest): Promise<AuthActionResult> => {
    setIsLoading(true)

    const result = await registerService(params)

    if (!result.user) {
      setIsLoading(false)
      return result
    }

    setUser(result.user)
    setAuthenticated(true)
    setIsLoading(false)
    return result
  }, [])

  /**
   * 登出
   */
  const logout = useCallback(async () => {
    setIsLoading(true)

    await logoutService()

    setUser(null)
    setAuthenticated(false)
    setIsLoading(false)
  }, [])

  return {
    isAuthenticated: authenticated,
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  }
}

// ==================== Exports ====================

export type { UseAuthResult }

export { useAuth }
