import { useState, useEffect } from 'react'

/**
 * Toast 消息管理 Hook
 *
 * 功能：
 * - 显示提示消息
 * - 3 秒后自动清除
 */
export function useToast(): {
  toast: string | null
  showToast: (message: string) => void
} {
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message: string) => {
    setToast(message)
  }

  return { toast, showToast }
}
