import { useState, useEffect } from 'react'

/**
 * 游戏高亮管理 Hook
 *
 * 功能：
 * - 设置高亮的游戏 ID
 * - 3 秒后自动清除高亮状态
 */
function useHighlight(): {
  highlightId: string | null
  setHighlightId: (id: string | null) => void
} {
  const [highlightId, setHighlightId] = useState<string | null>(null)

  useEffect(() => {
    if (highlightId) {
      const timer = setTimeout(() => setHighlightId(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightId])

  return { highlightId, setHighlightId }
}

// ==================== Exports ====================

export { useHighlight }
