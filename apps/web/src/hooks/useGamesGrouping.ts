import { useMemo } from 'react'
import type { Game, GameStatus } from '../types'

/**
 * 游戏分组和排序 Hook
 *
 * 功能：
 * - 按状态分组（playing, queueing, completion）
 * - 每组内按置顶状态和自定义排序权重排序
 *   - 置顶的游戏排在前面
 *   - 相同置顶状态下，sortOrder 越大越靠前
 *   - 如果仍然相同，保持后端分页原顺序，避免分页加载后出现插入中间
 */
function useGamesGrouping(games: Game[]): {
  playing: Game[]
  queueing: Game[]
  completion: Game[]
} {
  return useMemo(() => {
    const sortByPinnedAndOrder = (a: Game, b: Game) => {
      // 置顶的游戏排在前面
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      // 相同置顶状态，按 sortOrder 倒序
      const aSortOrder = a.sortOrder ?? 0
      const bSortOrder = b.sortOrder ?? 0
      if (aSortOrder !== bSortOrder) {
        return bSortOrder - aSortOrder
      }

      // 保持稳定顺序，尊重后端分页结果
      return 0
    }

    const filterAndSort = (status: GameStatus) =>
      games.filter((g) => g.status === status).sort(sortByPinnedAndOrder)

    return {
      playing: filterAndSort('playing'),
      queueing: filterAndSort('queueing'),
      completion: filterAndSort('completion'),
    }
  }, [games])
}

// ==================== Exports ====================

export { useGamesGrouping }
