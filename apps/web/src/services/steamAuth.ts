/**
 * Steam 认证服务
 */

import { STEAM_LOGIN_API } from '../constants/api'

// ==================== Types ====================

interface SteamUser {
  steamId: string
  username: string
  avatar: string
  profileUrl: string
}

interface JWTPayload {
  steamId: string
  username: string
  avatar: string
  profileUrl: string
  exp: number
  iat?: number
}

// ==================== Constants ====================

const STEAM_TOKEN_KEY = 'steam_auth_token'

// ==================== Helper Functions ====================

/**
 * 解码 JWT token
 * @param token - JWT token 字符串
 * @returns 成功时返回解码后的 payload，失败时返回 null
 */
function decodeJWT(token: string): JWTPayload | null {
  // Happy Path: token 无效
  if (!token || token.trim() === '') {
    console.error('[SteamAuth] Cannot decode JWT: Invalid token')
    return null
  }

  try {
    const parts = token.split('.')

    // Happy Path: token 格式不正确
    if (parts.length !== 3) {
      console.error('[SteamAuth] Invalid JWT format')
      return null
    }

    const base64Url = parts[1]

    // Happy Path: payload 部分为空
    if (!base64Url) {
      console.error('[SteamAuth] Empty JWT payload')
      return null
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    return JSON.parse(jsonPayload) as JWTPayload
  } catch (error) {
    console.error('[SteamAuth] Failed to decode JWT:', error)
    return null
  }
}

/**
 * 检查 token 是否过期
 * @param token - JWT token 字符串
 * @returns token 过期或无效返回 true，有效返回 false
 */
function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token)

  // Happy Path: 解码失败
  if (!decoded) {
    return true
  }

  // Happy Path: 没有过期时间
  if (!decoded.exp) {
    return true
  }

  const currentTime = Math.floor(Date.now() / 1000)
  return decoded.exp < currentTime
}

// ==================== Public API ====================

/**
 * 保存 Steam token 到本地存储
 * @param token - JWT token 字符串
 */
function saveSteamToken(token: string): void {
  // Happy Path: token 无效
  if (!token || token.trim() === '') {
    console.error('[SteamAuth] Cannot save token: Invalid token')
    return
  }

  localStorage.setItem(STEAM_TOKEN_KEY, token)
}

/**
 * 获取 Steam token
 * @returns 有效的 token，如果不存在或已过期则返回 null
 */
function getSteamToken(): string | null {
  const token = localStorage.getItem(STEAM_TOKEN_KEY)

  // Happy Path: token 不存在
  if (!token) {
    return null
  }

  // Happy Path: token 已过期
  if (isTokenExpired(token)) {
    localStorage.removeItem(STEAM_TOKEN_KEY)
    return null
  }

  return token
}

/**
 * 获取当前登录的 Steam 用户信息
 * @returns 用户信息，如果未登录或 token 无效则返回 null
 */
function getCurrentSteamUser(): SteamUser | null {
  const token = getSteamToken()

  // Happy Path: 没有 token
  if (!token) {
    return null
  }

  const decoded = decodeJWT(token)

  // Happy Path: 解码失败
  if (!decoded) {
    return null
  }

  return {
    steamId: decoded.steamId,
    username: decoded.username,
    avatar: decoded.avatar,
    profileUrl: decoded.profileUrl,
  }
}

/**
 * 退出 Steam 登录
 */
function logoutSteam(): void {
  localStorage.removeItem(STEAM_TOKEN_KEY)
}

/**
 * 初始化 Steam 登录流程
 * 优先尝试在 Steam 客户端的内置浏览器中打开，否则使用普通浏览器
 */
function initiateSteamLogin(): void {
  const loginUrl = STEAM_LOGIN_API

  // Happy Path: 登录 URL 无效
  if (!loginUrl || loginUrl.trim() === '') {
    console.error('[SteamAuth] Cannot initiate login: Invalid login URL')
    return
  }

  // 尝试在 Steam 客户端的内置浏览器中打开
  const steamProtocolUrl = `steam://openurl/${encodeURIComponent(loginUrl)}`

  // 检测 Steam 客户端是否成功打开
  let blurred = false
  const onBlur = () => {
    blurred = true
  }

  // 尝试打开 Steam 客户端
  window.location.href = steamProtocolUrl
  window.addEventListener('blur', onBlur)

  // 2 秒后检查，如果 Steam 客户端未打开，则使用普通浏览器
  setTimeout(() => {
    window.removeEventListener('blur', onBlur)

    if (!blurred) {
      // Steam 客户端未安装或未打开，使用普通浏览器
      console.log('[SteamAuth] Steam client not detected, using browser login')
      window.location.href = loginUrl
    } else {
      console.log('[SteamAuth] Opened login page in Steam client')
    }
  }, 2000)
}

/**
 * 处理 Steam 登录回调
 * 在页面加载时调用，检查 URL 参数中是否有 token 或 error
 * @returns 登录结果对象
 */
function handleSteamCallback(): { success: boolean; user?: SteamUser; error?: string } {
  const urlParams = new URLSearchParams(window.location.search)

  // Happy Path: 检查是否有错误
  const error = urlParams.get('steam_error')
  if (error) {
    console.error(`[SteamAuth] Login error: ${error}`)
    // 清除 URL 参数
    window.history.replaceState({}, document.title, window.location.pathname)
    return { success: false, error }
  }

  // Happy Path: 检查是否有 token
  const token = urlParams.get('steam_token')
  if (!token) {
    return { success: false }
  }

  // 保存 token
  saveSteamToken(token)

  // 清除 URL 参数
  window.history.replaceState({}, document.title, window.location.pathname)

  // 获取用户信息
  const user = getCurrentSteamUser()

  // Happy Path: 获取用户信息失败
  if (!user) {
    console.error('[SteamAuth] Failed to get user info after saving token')
    return { success: false, error: 'Failed to get user info' }
  }

  console.log(`[SteamAuth] Login successful: ${user.username}`)
  return { success: true, user }
}

/**
 * 检查是否已登录 Steam
 */
function isSteamLoggedIn(): boolean {
  return getSteamToken() !== null
}

// ==================== Exports ====================

export type { SteamUser }

export {
  saveSteamToken,
  getSteamToken,
  getCurrentSteamUser,
  logoutSteam,
  initiateSteamLogin,
  handleSteamCallback,
  isSteamLoggedIn,
}
