/**
 * 认证服务
 * 使用 Cookie-based Session Token 认证
 * 提供密码登录、注册、登出、Token 管理等功能
 */

import {
  AUTH_INVITE_CODES_API,
  AUTH_LOGIN_API,
  AUTH_LOGOUT_API,
  AUTH_REGISTER_API,
} from '@/constants/api'
import type {
  User,
  AuthActionResult,
  AuthResponse,
  InviteCodeActionResult,
  InviteCodeResponse,
  LoginRequest,
  RegisterRequest,
} from '@/types'

// ==================== Constants ====================

const TOKEN_KEY = 'session_token'
const USER_KEY = 'auth_user'

// ==================== Types ====================

interface ApiErrorResponse {
  error: string
  message: string
}

type AuthRequestPayload =
  | {
      account: string
      password: string
    }
  | RegisterRequest

// ==================== User Management ====================

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
 * 获取保存的 token
 */
function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 清除认证信息
 */
function clearAuthData(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function normalizeLoginRequest(params: LoginRequest): { account: string; password: string } {
  return {
    account: params.account?.trim() || params.username?.trim() || '',
    password: params.password,
  }
}

function mapAuthErrorMessage(message: string, fallback: string): string {
  switch (message) {
    case 'unauthorized':
    case 'user is inactive':
      return '账号或密码错误'
    case 'account already exists':
      return '账号已存在'
    case 'username already exists':
      return '用户名已存在'
    case 'invalid invite code':
      return '邀请码无效'
    case 'invite code has already been used':
      return '邀请码已被使用'
    case 'daily invite quota reached':
      return '今天的邀请码额度已经用完了'
    case 'account must be 3-32 chars and use only letters, numbers, dot, underscore, or hyphen':
      return '账号需为 3-32 位，只能使用小写字母、数字、点、下划线或连字符'
    case 'username is required':
      return '请输入用户名'
    case 'username must be at most 100 characters':
      return '用户名最多 100 个字符'
    case 'password must be at least 8 characters':
      return '密码至少需要 8 位'
    case 'password must be at most 72 characters':
      return '密码不能超过 72 位'
    case 'internal server error':
      return '服务器开小差了，请稍后再试'
    default:
      return message || fallback
  }
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const error = (await response.json()) as Partial<ApiErrorResponse>
    const message = error.message || error.error || fallback
    return mapAuthErrorMessage(message, fallback)
  } catch (error) {
    console.error('[Auth] Failed to parse error response:', error)
    return fallback
  }
}

async function parseAuthSuccess(response: Response): Promise<AuthActionResult> {
  const data = (await response.json()) as AuthResponse

  if (!data.data || !data.data.token || !data.data.user) {
    console.error('[Auth] Invalid response: missing token or user')
    return { user: null, error: '服务器返回了无效的登录结果' }
  }

  saveAuthData(data.data.token, data.data.user)
  return { user: data.data.user, error: null }
}

async function authenticate(
  url: string,
  payload: AuthRequestPayload,
  actionLabel: 'login' | 'register'
): Promise<AuthActionResult> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const fallback = actionLabel === 'login' ? '登录失败，请稍后重试' : '注册失败，请稍后重试'
      const errorMessage = await parseErrorMessage(response, fallback)
      console.error(`[Auth] ${actionLabel} failed: ${response.status} - ${errorMessage}`)
      return { user: null, error: errorMessage }
    }

    const result = await parseAuthSuccess(response)
    if (!result.error) {
      console.log(`[Auth] ${actionLabel} successful, token saved`)
    }
    return result
  } catch (error) {
    console.error(`[Auth] Error during ${actionLabel}:`, error)
    return {
      user: null,
      error: actionLabel === 'login' ? '登录失败，请检查网络连接' : '注册失败，请检查网络连接',
    }
  }
}

// ==================== API Methods ====================

/**
 * 账号密码登录
 * @param params - 登录参数（兼容 account/username）
 * @returns 登录结果
 */
async function login(params: LoginRequest): Promise<AuthActionResult> {
  return authenticate(AUTH_LOGIN_API, normalizeLoginRequest(params), 'login')
}

/**
 * 注册并自动登录
 * @param params - 注册参数
 * @returns 注册结果
 */
async function register(params: RegisterRequest): Promise<AuthActionResult> {
  return authenticate(
    AUTH_REGISTER_API,
    {
      account: params.account.trim(),
      username: params.username.trim(),
      password: params.password,
      inviteCode: params.inviteCode.trim(),
    },
    'register'
  )
}

/**
 * 生成或获取今日邀请码
 * @returns 邀请码结果
 */
async function generateInviteCode(): Promise<InviteCodeActionResult> {
  const token = getToken()

  if (!token) {
    return { inviteCode: null, error: '请先登录后再生成邀请码' }
  }

  try {
    const response = await fetch(AUTH_INVITE_CODES_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, '生成邀请码失败，请稍后重试')
      console.error(`[Auth] generate invite code failed: ${response.status} - ${errorMessage}`)
      return { inviteCode: null, error: errorMessage }
    }

    const data = (await response.json()) as InviteCodeResponse

    if (!data.data?.code) {
      console.error('[Auth] Invalid invite code response: missing code')
      return { inviteCode: null, error: '服务器返回了无效的邀请码结果' }
    }

    return { inviteCode: data.data, error: null }
  } catch (error) {
    console.error('[Auth] Error during generate invite code:', error)
    return { inviteCode: null, error: '生成邀请码失败，请检查网络连接' }
  }
}

/**
 * 登出
 * @returns 成功返回 true，失败返回 false
 */
async function logout(): Promise<boolean> {
  const token = getToken()

  if (token) {
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
    } catch (error) {
      console.error('[Auth] Error during logout:', error)
    }
  }

  // 无论服务器响应如何，都清除本地认证信息
  clearAuthData()
  console.log('[Auth] Logout successful, token cleared')
  return true
}

/**
 * 检查是否已登录
 * 通过本地是否有用户信息判断
 * 注意：实际的认证状态由服务器 Cookie 决定
 */
function isAuthenticated(): boolean {
  return getUser() !== null
}

/**
 * 获取当前登录用户
 */
function getCurrentUser(): User | null {
  return getUser()
}

// ==================== Exports ====================

export {
  login,
  register,
  generateInviteCode,
  logout,
  isAuthenticated,
  getCurrentUser,
  getToken,
  clearAuthData,
}
