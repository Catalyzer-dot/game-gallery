import { useMemo } from 'react'
import type { Game } from '../types'
import type { SearchResult } from '../components/SearchBar'

/**
 * 游戏搜索 Hook
 *
 * 功能：
 * - 搜索 Steam 游戏（按名称）
 * - 搜索小游戏（按名称和描述）
 * - 返回统一的搜索结果格式
 */
function useGameSearch(games: Game[], searchTerm: string): SearchResult[] {
  return useMemo(() => {
    if (!searchTerm) return []

    const results: SearchResult[] = []
    const lowerSearch = searchTerm.toLowerCase()

    // 搜索 Steam 游戏
    games.forEach((game) => {
      if (game.name.toLowerCase().includes(lowerSearch)) {
        results.push({
          id: game.id,
          name: game.name,
          type: 'steam-game',
          status: game.status,
          mainTab: 'steamgames',
        })
      }
    })

    // 搜索小游戏
    const miniGames = [
      { id: 'snake', name: '贪吃蛇', description: '经典贪吃蛇游戏，控制蛇吃食物并避免撞墙' },
      { id: '2048', name: '2048', description: '滑动方块合并相同数字，挑战达到 2048' },
      { id: 'memory', name: '记忆翻牌', description: '翻开卡片找出所有配对，挑战你的记忆力' },
      { id: 'tower', name: '塔防', description: '建造防御塔抵御敌人，通过三个关卡' },
      { id: 'breakout', name: '打砖块', description: '经典街机游戏，用挡板接球打碎砖块' },
      { id: 'flappy', name: 'Flappy Bird', description: '点击屏幕控制小鸟飞行，躲避管道障碍' },
      { id: 'match3', name: '连连看', description: '找到相同图案配对消除，挑战你的眼力' },
      { id: 'jump', name: '跳一跳', description: '长按蓄力跳跃，落在中心获得连击加分' },
      { id: 'fruit', name: '接水果', description: '控制篮子接住水果得分，躲避炸弹' },
      { id: 'sokoban', name: '推箱子', description: '经典益智游戏，推动箱子到指定位置' },
    ]

    miniGames.forEach((game) => {
      if (
        game.name.toLowerCase().includes(lowerSearch) ||
        game.description.toLowerCase().includes(lowerSearch)
      ) {
        results.push({
          id: game.id,
          name: game.name,
          type: 'mini-game',
          mainTab: 'playground',
        })
      }
    })

    return results
  }, [games, searchTerm])
}

// ==================== Exports ====================

export { useGameSearch }
