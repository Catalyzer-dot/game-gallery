import { useMemo } from 'react'
import type { Game, GameStatus } from '../types'

/**
 * 游戏分组和排序 Hook
 *
 * 功能：
 * - 按状态分组（playing, queueing, completion）
 * - 每组内按置顶状态和最后更新时间排序
 *   - 置顶的游戏排在前面
 *   - 相同置顶状态的游戏按最后更新时间倒序排列
 */
export function useGamesGrouping(games: Game[]): {
  playing: Game[]
  queueing: Game[]
  completion: Game[]
} {
  return useMemo(() => {
    const sortByPinnedAndDate = (a: Game, b: Game) => {
      // 置顶的游戏排在前面
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      // 相同置顶状态，按最后更新时间倒序
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    }

    const filterAndSort = (status: GameStatus) =>
      games.filter((g) => g.status === status).sort(sortByPinnedAndDate)

    return {
      playing: filterAndSort('playing'),
      queueing: filterAndSort('queueing'),
      completion: filterAndSort('completion'),
    }
  }, [games])
}
