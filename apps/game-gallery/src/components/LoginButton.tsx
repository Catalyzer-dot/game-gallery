/**
 * 登录表单组件
 * 提供账号密码登录和邀请码注册功能
 * 支持紧凑模式（横向）和完整模式（纵向）
 */

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { generateInviteCode as generateInviteCodeService } from '@/services/auth'
import type { InviteCodeData } from '@/types'
import { Loader2, LogIn, LogOut, Plus } from './icons/Icons'
import styles from './LoginButton.module.scss'

// ==================== Types ====================

interface LoginButtonProps {
  mode?: 'compact' | 'full' // 紧凑模式或完整模式
  onLoginSuccess?: () => void // 登录成功回调
}

type AuthMode = 'login' | 'register'

const ACCOUNT_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/

function formatInviteCode(value: string): string {
  const compact = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12)

  return compact.replace(/(.{4})/g, '$1-').replace(/-$/, '')
}

// ==================== Component ====================

function LoginButton({ mode = 'compact', onLoginSuccess }: LoginButtonProps = {}) {
  const { isAuthenticated, user, isLoading, login, register, logout } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [account, setAccount] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [generatedInvite, setGeneratedInvite] = useState<InviteCodeData | null>(null)
  const [inviteActionError, setInviteActionError] = useState<string | null>(null)
  const [inviteActionMessage, setInviteActionMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false)

  const resetMessages = () => {
    setError(null)
  }

  const resetForm = () => {
    setAccount('')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setInviteCode('')
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessages()

    if (!account.trim() || !password.trim()) {
      setError('请输入账号和密码')
      return
    }

    setIsSubmitting(true)

    const result = await login(account.trim(), password)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    resetForm()
    setIsSubmitting(false)
    onLoginSuccess?.()
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessages()

    const normalizedAccount = account.trim().toLowerCase()
    const trimmedUsername = username.trim()

    if (
      !normalizedAccount ||
      !trimmedUsername ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !inviteCode.trim()
    ) {
      setError('请完整填写注册信息')
      return
    }

    if (!ACCOUNT_RE.test(normalizedAccount)) {
      setError('账号需为 3-32 位，只能使用小写字母、数字、点、下划线或连字符')
      return
    }

    if (trimmedUsername.length > 100) {
      setError('用户名最多 100 个字符')
      return
    }

    if (password.length < 8) {
      setError('密码至少需要 8 位')
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setIsSubmitting(true)

    const result = await register({
      account: normalizedAccount,
      username: trimmedUsername,
      password,
      inviteCode,
    })

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    resetForm()
    setIsSubmitting(false)
    onLoginSuccess?.()
  }

  const handleModeChange = (nextMode: AuthMode) => {
    setAuthMode(nextMode)
    resetMessages()
  }

  const handleGenerateInviteCode = async () => {
    setInviteActionError(null)
    setInviteActionMessage(null)
    setIsGeneratingInvite(true)

    const result = await generateInviteCodeService()

    if (result.error) {
      setInviteActionError(result.error)
      setIsGeneratingInvite(false)
      return
    }

    setGeneratedInvite(result.inviteCode)
    setInviteActionMessage(
      result.inviteCode?.reused_existing ? '已返回你今天尚未使用的邀请码。' : '今日邀请码已生成。'
    )
    setIsGeneratingInvite(false)
  }

  const handleCopyInviteCode = async () => {
    if (!generatedInvite?.code) {
      return
    }

    try {
      await navigator.clipboard.writeText(generatedInvite.code)
      setInviteActionError(null)
      setInviteActionMessage('邀请码已复制到剪贴板。')
    } catch (error) {
      console.error('[Auth] Failed to copy invite code:', error)
      setInviteActionError('复制失败，请手动复制邀请码')
    }
  }

  const handleLogout = async () => {
    setGeneratedInvite(null)
    setInviteActionError(null)
    setInviteActionMessage(null)
    await logout()
  }

  if (isLoading) {
    return (
      <div className={styles.loginContainer}>
        <button className={styles.loading} disabled>
          加载中...
        </button>
      </div>
    )
  }

  if (isAuthenticated && user) {
    if (mode === 'full') {
      return (
        <div className={styles.fullMode}>
          <div className={styles.userProfile}>
            <div className={styles.userInfoFull}>
              <div className={styles.usernameFull}>
                <LogIn size={18} />
                已登录：{user.username}
              </div>
              <p className={styles.helpText}>你可以在这里生成今天可用的邀请码，发给其他人注册。</p>
            </div>

            <div className={styles.invitePanel}>
              <div className={styles.inviteHeader}>
                <span className={styles.inviteTitle}>今日邀请码</span>
                {generatedInvite?.reused_existing && (
                  <span className={styles.inviteBadge}>今日已生成，重复返回</span>
                )}
              </div>

              {generatedInvite ? (
                <>
                  <div className={styles.inviteCodeValue}>{generatedInvite.code}</div>
                  <p className={styles.inviteMeta}>有效日期：{generatedInvite.generated_for_day}</p>
                </>
              ) : (
                <p className={styles.invitePlaceholder}>
                  还没有读取今天的邀请码，点击下方按钮生成或取回。
                </p>
              )}

              {inviteActionMessage && <p className={styles.successText}>{inviteActionMessage}</p>}
              {inviteActionError && <p className={styles.errorText}>{inviteActionError}</p>}
            </div>

            <div className={styles.actionRow}>
              <button
                type="button"
                onClick={handleGenerateInviteCode}
                className={styles.btnLoginFull}
                disabled={isGeneratingInvite}
              >
                {isGeneratingInvite ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    处理中...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    生成今日邀请码
                  </>
                )}
              </button>

              {generatedInvite && (
                <button
                  type="button"
                  onClick={handleCopyInviteCode}
                  className={styles.btnSecondaryFull}
                >
                  复制邀请码
                </button>
              )}

              <button type="button" onClick={handleLogout} className={styles.btnLogoutFull}>
                <LogOut size={18} />
                退出登录
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={styles.loginContainer}>
        <div className={styles.userInfo}>
          <span className={styles.username}>欢迎，{user.username}</span>
        </div>
        <button onClick={handleLogout} className={styles.btnLogout}>
          登出
        </button>
      </div>
    )
  }

  if (mode === 'full') {
    return (
      <div className={styles.fullMode}>
        <div className={styles.authTabs}>
          <button
            type="button"
            className={`${styles.authTab} ${authMode === 'login' ? styles.authTabActive : ''}`}
            onClick={() => handleModeChange('login')}
          >
            <LogIn size={16} />
            登录
          </button>
          <button
            type="button"
            className={`${styles.authTab} ${authMode === 'register' ? styles.authTabActive : ''}`}
            onClick={() => handleModeChange('register')}
          >
            <Plus size={16} />
            注册
          </button>
        </div>

        <form
          onSubmit={authMode === 'login' ? handleLoginSubmit : handleRegisterSubmit}
          className={styles.loginFormFull}
        >
          {error && <div className={styles.errorBoxFull}>{error}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>账号</label>
            <input
              type="text"
              placeholder="如 degenerates.player"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              disabled={isSubmitting}
              className={styles.inputFull}
              autoComplete="username"
              autoFocus
            />
          </div>

          {authMode === 'register' && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.label}>用户名</label>
                <input
                  type="text"
                  placeholder="展示给其他玩家的名字"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  className={styles.inputFull}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>邀请码</label>
                <input
                  type="text"
                  placeholder="ABCD-EFGH-JKLM"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(formatInviteCode(e.target.value))}
                  disabled={isSubmitting}
                  className={styles.inputFull}
                  autoCapitalize="characters"
                  autoCorrect="off"
                />
              </div>
            </>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>密码</label>
            <input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className={styles.inputFull}
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {authMode === 'register' && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>确认密码</label>
              <input
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                className={styles.inputFull}
                autoComplete="new-password"
              />
            </div>
          )}

          <p className={styles.helpText}>
            {authMode === 'login'
              ? '使用已注册账号登录。账号区分格式但会自动转为小写。'
              : '注册需要有效邀请码；成功后会自动登录当前账号。'}
          </p>

          <button type="submit" disabled={isSubmitting} className={styles.btnLoginFull}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                {authMode === 'login' ? '登录中...' : '注册中...'}
              </>
            ) : (
              <>
                {authMode === 'login' ? <LogIn size={18} /> : <Plus size={18} />}
                {authMode === 'login' ? '登录' : '注册并登录'}
              </>
            )}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className={styles.loginContainer}>
      <form onSubmit={handleLoginSubmit} className={styles.loginForm}>
        {error && <span className={styles.error}>{error}</span>}

        <input
          type="text"
          placeholder="账号"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          disabled={isSubmitting}
          className={styles.input}
          autoComplete="username"
        />

        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          className={styles.input}
          autoComplete="current-password"
        />

        <button type="submit" disabled={isSubmitting} className={styles.btnLogin}>
          {isSubmitting ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  )
}

// ==================== Exports ====================

export default LoginButton
