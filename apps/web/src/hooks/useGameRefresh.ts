import { useEffect, useRef } from 'react'
import type { Game } from '../types'
import { steamService } from '../services/steam'
import { githubService } from '../services/github'

/**
 * 游戏信息定时刷新 Hook
 *
 * 功能：
 * - 延迟 2 秒后进行首次刷新（优先刷新缺少好评率的游戏）
 * - 每 30 分钟自动刷新一次
 * - 从 Steam API 获取游戏的好评率、发布日期、抢先体验状态
 * - 更新后统一保存到 GitHub（使用并发安全的 concurrentUpdateGames）
 * - 防止 API 限流（每个游戏之间延迟 1 秒）
 */
export function useGameRefresh(games: Game[], onGamesUpdate: (games: Game[]) => void): void {
  // 使用 ref 保存最新的 games 状态，避免闭包陷阱
  const gamesRef = useRef(games)

  useEffect(() => {
    gamesRef.current = games
  }, [games])

  useEffect(() => {
    /**
     * 刷新游戏信息
     * @param {boolean} prioritizeMissing - 是否优先刷新缺少数据的游戏
     */
    const refreshReviews = async (prioritizeMissing = false) => {
      const currentGames = gamesRef.current
      if (currentGames.length === 0) return

      console.log(
        prioritizeMissing
          ? '开始刷新游戏信息（包含所有游戏的抢先体验状态）...'
          : '开始刷新游戏好评率...'
      )

      // 按优先级排序：缺少好评率的游戏优先
      let gamesToRefresh = [...currentGames]
      if (prioritizeMissing) {
        gamesToRefresh = gamesToRefresh.sort((a, b) => {
          const aMissing = a.positivePercentage === null || a.positivePercentage === undefined
          const bMissing = b.positivePercentage === null || b.positivePercentage === undefined
          if (aMissing && !bMissing) return -1
          if (!aMissing && bMissing) return 1
          return 0
        })
      }

      let hasAnyUpdate = false

      for (const game of gamesToRefresh) {
        if (!game.steamUrl) continue

        // 从 steamUrl 中提取 appId
        const match = game.steamUrl.match(/\/app\/(\d+)/)
        if (!match) continue

        const appId = parseInt(match[1])

        try {
          // 在首次刷新时，强制刷新所有游戏的抢先体验状态
          // 在定期刷新时，只刷新缺少数据的游戏或已标记为抢先体验的游戏（确保游戏转正时能及时更新）
          const needsReleaseInfo =
            prioritizeMissing ||
            !game.releaseDate ||
            game.isEarlyAccess === null ||
            game.isEarlyAccess === undefined ||
            game.isEarlyAccess === true

          const [reviews, releaseInfo] = await Promise.all([
            steamService.getGameReviews(appId),
            needsReleaseInfo
              ? steamService.getGameReleaseDate(appId)
              : Promise.resolve({
                  releaseDate: game.releaseDate,
                  comingSoon: game.comingSoon,
                  isEarlyAccess: game.isEarlyAccess,
                  genres: null,
                }),
          ])

          // 如果获取到了数据，或者数据有变化时更新
          const needsUpdate =
            game.positivePercentage === null ||
            game.positivePercentage === undefined ||
            game.releaseDate === null ||
            game.releaseDate === undefined ||
            game.isEarlyAccess === null ||
            game.isEarlyAccess === undefined ||
            reviews.positivePercentage !== game.positivePercentage ||
            reviews.totalReviews !== game.totalReviews ||
            (needsReleaseInfo && releaseInfo.releaseDate !== game.releaseDate) ||
            (needsReleaseInfo && releaseInfo.isEarlyAccess !== game.isEarlyAccess)

          if (
            needsUpdate &&
            (reviews.positivePercentage !== null ||
              reviews.totalReviews !== null ||
              releaseInfo.releaseDate !== null ||
              releaseInfo.isEarlyAccess !== null)
          ) {
            hasAnyUpdate = true

            // 更新本地状态
            onGamesUpdate(
              gamesRef.current.map((g) => {
                if (g.id === game.id) {
                  // 使用最新的游戏状态，只更新好评率相关字段
                  return {
                    ...g,
                    positivePercentage: reviews.positivePercentage ?? g.positivePercentage,
                    totalReviews: reviews.totalReviews ?? g.totalReviews,
                    releaseDate: releaseInfo.releaseDate ?? g.releaseDate,
                    comingSoon: releaseInfo.comingSoon ?? g.comingSoon,
                    isEarlyAccess: releaseInfo.isEarlyAccess ?? g.isEarlyAccess,
                    // 不更新 lastUpdated，保持原有排序
                  }
                }
                return g
              })
            )

            console.log(
              `已更新 ${game.name} 的信息: 好评率 ${reviews.positivePercentage}%, 发布日期 ${releaseInfo.releaseDate}, 抢先体验 ${releaseInfo.isEarlyAccess}`
            )
          }
        } catch (err) {
          console.error(`刷新 ${game.name} 信息失败:`, err)
        }

        // 添加延迟避免请求过快（防止 API 限流）
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      console.log(prioritizeMissing ? '游戏信息刷新完成（已刷新抢先体验状态）' : '好评率刷新完成')

      // 所有游戏刷新完成后，统一保存一次到 GitHub
      if (hasAnyUpdate) {
        try {
          const finalGames = await githubService.concurrentUpdateGames((remoteGames) => {
            // 将最新的好评率数据合并到远程数据中
            // 以远程数据为基准，只更新好评率相关字段
            const updatedRemoteGames = remoteGames.map((remoteGame) => {
              const localUpdate = gamesRef.current.find((g) => g.id === remoteGame.id)
              if (localUpdate) {
                // 如果本地有更新（好评率等），应用到远程数据
                return {
                  ...remoteGame,
                  positivePercentage: localUpdate.positivePercentage,
                  totalReviews: localUpdate.totalReviews,
                  releaseDate: localUpdate.releaseDate,
                  comingSoon: localUpdate.comingSoon,
                  isEarlyAccess: localUpdate.isEarlyAccess,
                }
              }
              return remoteGame
            })
            return updatedRemoteGames
          }, 'Update games info after refresh')

          // 更新本地状态以匹配远程
          onGamesUpdate(finalGames)
          console.log('已保存所有游戏信息到 GitHub')
        } catch (err) {
          console.error('保存游戏信息到 GitHub 失败:', err)
        }
      }
    }

    // 延迟 2 秒后进行首次刷新，优先处理缺少好评率的游戏
    const initialTimer = setTimeout(() => refreshReviews(true), 2000)

    // 每 30 分钟刷新一次
    const interval = setInterval(() => refreshReviews(false), 30 * 60 * 1000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
