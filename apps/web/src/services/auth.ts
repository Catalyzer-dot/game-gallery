/**
 * 认证服务
 * 提供 Steam 登录、登出、Token 管理等功能
 */

import { AUTH_LOGIN_API, AUTH_REFRESH_API, AUTH_LOGOUT_API } from '@/constants/api'
import type { User, AuthResponse, LoginUrlResponse, RefreshTokenResponse } from '@/types'

// ==================== Constants ====================

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

// ==================== Types ====================

interface GetLoginUrlRequest {
  returnUrl?: string
}

interface ApiResponse<T> {
  data: T
}

// ==================== Helper Functions ====================

/**
 * 解码 JWT token 获取 payload
 */
function decodeJWT(token: string): Record<string, unknown> | null {
  if (!token || token.trim() === '') {
    return null
  }

  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const base64Url = parts[1]
    if (!base64Url) {
      return null
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    return JSON.parse(jsonPayload) as Record<string, unknown>
  } catch (error) {
    console.error('[Auth] Failed to decode JWT:', error)
    return null
  }
}

/**
 * 检查 token 是否过期
 */
function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token)

  if (!decoded) {
    return true
  }

  if (typeof decoded.exp !== 'number') {
    return true
  }

  const currentTime = Math.floor(Date.now() / 1000)
  return decoded.exp < currentTime
}

/**
 * 检查 token 是否需要刷新（剩余时间少于 1 小时）
 */
function shouldRefreshToken(token: string): boolean {
  const decoded = decodeJWT(token)

  if (!decoded) {
    return false
  }

  if (typeof decoded.exp !== 'number') {
    return false
  }

  const currentTime = Math.floor(Date.now() / 1000)
  const oneHour = 60 * 60
  return decoded.exp - currentTime < oneHour
}

// ==================== Token Management ====================

/**
 * 保存认证信息到本地存储
 */
function saveAuthData(token: string, user: User): void {
  if (!token || token.trim() === '') {
    console.error('[Auth] Cannot save auth data: Invalid token')
    return
  }

  if (!user || !user.id) {
    console.error('[Auth] Cannot save auth data: Invalid user')
    return
  }

  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * 获取保存的 token
 * @returns 有效的 token，如果不存在或已过期则返回 null
 */
function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)

  if (!token) {
    return null
  }

  if (isTokenExpired(token)) {
    clearAuthData()
    return null
  }

  return token
}

/**
 * 获取保存的用户信息
 */
function getUser(): User | null {
  const userJson = localStorage.getItem(USER_KEY)

  if (!userJson) {
    return null
  }

  try {
    return JSON.parse(userJson) as User
  } catch (error) {
    console.error('[Auth] Failed to parse user data:', error)
    return null
  }
}

/**
 * 清除认证信息
 */
function clearAuthData(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// ==================== API Methods ====================

/**
 * 获取 Steam 登录 URL
 * @param params - 可选的返回 URL
 * @returns 登录 URL，失败时返回 null
 */
async function getLoginUrl(params?: GetLoginUrlRequest): Promise<string | null> {
  try {
    const url = new URL(AUTH_LOGIN_API)

    if (params?.returnUrl) {
      url.searchParams.append('return_url', params.returnUrl)
    }

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error(`[Auth] Failed to get login URL: ${response.status} ${response.statusText}`)
      return null
    }

    const data = (await response.json()) as ApiResponse<LoginUrlResponse>

    if (!data.data || !data.data.login_url) {
      console.error('[Auth] Invalid response: missing login_url')
      return null
    }

    return data.data.login_url
  } catch (error) {
    console.error('[Auth] Error getting login URL:', error)
    return null
  }
}

/**
 * 刷新 JWT token
 * @returns 新的 token，失败时返回 null
 */
async function refreshToken(): Promise<string | null> {
  const currentToken = getToken()

  if (!currentToken) {
    console.error('[Auth] Cannot refresh token: No token available')
    return null
  }

  try {
    const response = await fetch(AUTH_REFRESH_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    })

    if (!response.ok) {
      console.error(`[Auth] Failed to refresh token: ${response.status} ${response.statusText}`)
      clearAuthData()
      return null
    }

    const data = (await response.json()) as ApiResponse<RefreshTokenResponse>

    if (!data.data || !data.data.token) {
      console.error('[Auth] Invalid response: missing token')
      return null
    }

    const newToken = data.data.token
    const user = getUser()

    if (user) {
      saveAuthData(newToken, user)
    }

    return newToken
  } catch (error) {
    console.error('[Auth] Error refreshing token:', error)
    return null
  }
}

/**
 * 登出
 * @returns 成功返回 true，失败返回 false
 */
async function logout(): Promise<boolean> {
  const token = getToken()

  if (!token) {
    clearAuthData()
    return true
  }

  try {
    const response = await fetch(AUTH_LOGOUT_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      console.error(`[Auth] Failed to logout: ${response.status} ${response.statusText}`)
    }

    clearAuthData()
    return true
  } catch (error) {
    console.error('[Auth] Error during logout:', error)
    clearAuthData()
    return true
  }
}

/**
 * 处理认证回调
 * 从后端回调返回的数据中提取并保存认证信息
 * 注意：此方法假设后端在回调后返回完整的 AuthResponse
 */
function handleAuthCallback(authData: AuthResponse): boolean {
  if (!authData.token || !authData.user) {
    console.error('[Auth] Invalid auth data')
    return false
  }

  saveAuthData(authData.token, authData.user)
  return true
}

/**
 * 检查是否已登录
 */
function isAuthenticated(): boolean {
  return getToken() !== null
}

/**
 * 获取当前登录用户
 */
function getCurrentUser(): User | null {
  if (!isAuthenticated()) {
    return null
  }

  return getUser()
}

/**
 * 自动刷新 token（如果需要）
 * 建议在应用启动时或定期调用
 */
async function autoRefreshToken(): Promise<void> {
  const token = getToken()

  if (!token) {
    return
  }

  if (shouldRefreshToken(token)) {
    await refreshToken()
  }
}

// ==================== Exports ====================

export type { GetLoginUrlRequest }

export {
  getLoginUrl,
  refreshToken,
  logout,
  handleAuthCallback,
  isAuthenticated,
  getCurrentUser,
  getToken,
  autoRefreshToken,
  clearAuthData,
}
