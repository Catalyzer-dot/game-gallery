/**
 * 认证 Hook
 * 提供认证状态管理和操作方法
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getLoginUrl,
  logout as logoutService,
  isAuthenticated,
  getCurrentUser as getCurrentUserService,
  autoRefreshToken,
} from '@/services/auth'
import type { User } from '@/types'

// ==================== Types ====================

interface UseAuthResult {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  login: (returnUrl?: string) => Promise<void>
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
    const init = async () => {
      // 尝试自动刷新 token
      await autoRefreshToken()

      // 加载用户信息
      refreshUser()
      setIsLoading(false)
    }

    init()
  }, [refreshUser])

  /**
   * 登录 - 跳转到 Steam 登录页面
   */
  const login = useCallback(async (returnUrl?: string) => {
    setIsLoading(true)

    const loginUrlValue = await getLoginUrl({ returnUrl })

    if (!loginUrlValue) {
      console.error('[useAuth] Failed to get login URL')
      setIsLoading(false)
      return
    }

    // 重定向到 Steam 登录页面
    window.location.href = loginUrlValue
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
    logout,
    refreshUser,
  }
}

// ==================== Exports ====================

export type { UseAuthResult }

export { useAuth }
