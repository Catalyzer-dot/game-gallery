/**
 * Steam 登录回调处理组件
 * 处理从 Steam 返回的认证信息
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleAuthCallback } from '@/services/auth'
import type { AuthResponse } from '@/types'

// ==================== Component ====================

function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      // 从 URL 查询参数中获取认证数据
      const urlParams = new URLSearchParams(window.location.search)

      // 检查是否有错误
      const errorParam = urlParams.get('error')
      if (errorParam) {
        setError(errorParam)
        setIsProcessing(false)
        return
      }

      // 注意：实际的回调处理取决于后端如何返回数据
      // 这里假设后端通过 URL 参数返回 token 和用户信息
      // 或者后端可能直接返回 JSON 响应

      // 方案 1: 从 URL 参数获取（如果后端通过重定向传递）
      const token = urlParams.get('token')
      const userJson = urlParams.get('user')

      if (token && userJson) {
        try {
          const user = JSON.parse(decodeURIComponent(userJson))
          const authData: AuthResponse = { token, user }

          const success = handleAuthCallback(authData)

          if (success) {
            // 登录成功，跳转到主页
            navigate('/', { replace: true })
          } else {
            setError('Failed to process authentication data')
            setIsProcessing(false)
          }
        } catch (err) {
          console.error('[AuthCallback] Error parsing user data:', err)
          setError('Invalid authentication data')
          setIsProcessing(false)
        }
        return
      }

      // 方案 2: 如果后端直接返回 JSON（需要从 fetch 获取）
      // 这种情况下，后端应该在回调 URL 中包含完整的响应
      // 或者前端需要再次请求后端 API 来获取认证信息

      setError('No authentication data received')
      setIsProcessing(false)
    }

    processCallback()
  }, [navigate])

  if (isProcessing) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Processing login...</h2>
        <p>Please wait while we complete your authentication.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Login Failed</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
        >
          Back to Home
        </button>
      </div>
    )
  }

  return null
}

// ==================== Exports ====================

export default AuthCallback
