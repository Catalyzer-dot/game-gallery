/**
 * 登录按钮组件
 * 展示如何使用 useAuth Hook
 */

import { useAuth } from '@/hooks/useAuth'

// ==================== Component ====================

function LoginButton() {
  const { isAuthenticated, user, isLoading, login, logout } = useAuth()

  if (isLoading) {
    return <button disabled>Loading...</button>
  }

  if (isAuthenticated && user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img
          src={user.avatar_url}
          alt={user.username}
          style={{ width: '32px', height: '32px', borderRadius: '50%' }}
        />
        <span>{user.username}</span>
        <button onClick={logout}>Logout</button>
      </div>
    )
  }

  return (
    <button onClick={() => login(window.location.origin + '/auth/callback')}>
      Login with Steam
    </button>
  )
}

// ==================== Exports ====================

export default LoginButton
