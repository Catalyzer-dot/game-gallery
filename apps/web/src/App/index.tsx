import { useState, useEffect, lazy, Suspense } from 'react'
import classNames from 'classnames'
import { GameItem } from '../components/GameItem'
import { SearchBar, type SearchResult } from '../components/SearchBar'
import type { Game, GameStatus } from '../types'
import { AnimatePresence, motion } from 'framer-motion'
import { SettingsIcon, Loader2, Play, Bookmark, CheckCircle, Library, Sparkles } from 'lucide-react'
import { githubService } from '../services/github'
import { steamService } from '../services/steam'
import { handleSteamCallback } from '../services/steamAuth'
import styles from './index.module.scss'

// 导入自定义 hooks
import { useToast } from '../hooks/useToast'
import { useHighlight } from '../hooks/useHighlight'
import { useGamesGrouping } from '../hooks/useGamesGrouping'
import { useGameSearch } from '../hooks/useGameSearch'
import { useGameRefresh } from '../hooks/useGameRefresh'

// 懒加载重组件（命名导出转换为默认导出）
const MiniGames = lazy(() =>
  import('../components/MiniGames').then((module) => ({ default: module.MiniGames }))
)
const SteamSearch = lazy(() =>
  import('../components/SteamSearch').then((module) => ({ default: module.SteamSearch }))
)
const Settings = lazy(() =>
  import('../components/Settings').then((module) => ({ default: module.Settings }))
)

function App() {
  // 状态管理
  const [games, setGames] = useState<Game[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSteamSearch, setShowSteamSearch] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [mainTab, setMainTab] = useState<'steamgames' | 'playground'>('steamgames')
  const [activeTab, setActiveTab] = useState<'playing' | 'queueing' | 'completion'>('playing')

  // 使用自定义 hooks
  const { toast, showToast } = useToast()
  const { highlightId, setHighlightId } = useHighlight()
  const groupedGames = useGamesGrouping(games)
  const searchResults = useGameSearch(games, searchTerm)

  // 定时刷新游戏信息
  useGameRefresh(games, setGames)

  // Handle Steam login callback
  useEffect(() => {
    const result = handleSteamCallback()
    if (result.success && result.user) {
      showToast(`欢迎，${result.user.username}！Steam 登录成功`)
    } else if (result.error) {
      showToast('Steam 登录失败，请重试')
    }
  }, [showToast])

  // Fetch games on mount
  useEffect(() => {
    const loadGames = async () => {
      if (!githubService.isConfigured()) {
        setShowSettings(true)
        return
      }

      setIsLoading(true)
      try {
        const data = await githubService.fetchGames()

        // 数据迁移：将 pending 状态迁移为 queueing
        const hasPendingGames = data.games.some((g: Game) => (g.status as string) === 'pending')

        if (hasPendingGames) {
          console.log('Migrating pending games to queueing...')
          const migratedGames = data.games.map((g: Game) =>
            (g.status as string) === 'pending' ? { ...g, status: 'queueing' as GameStatus } : g
          )

          // 保存迁移后的数据
          await githubService.updateGames(
            { games: migratedGames },
            'Migrate pending status to queueing'
          )

          setGames(migratedGames)
          showToast('数据已自动迁移：pending → queueing')
          console.log('Migration completed')
        } else {
          setGames(data.games)
        }
      } catch (err) {
        console.error('Failed to fetch games:', err)
        showToast('加载游戏失败。请检查 GitHub 配置。')
        setShowSettings(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadGames()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 以下 useEffect 已被提取到自定义 hooks 中：
  // - highlightId 自动清除 → useHighlight
  // - toast 自动清除 → useToast
  // - 定时刷新游戏信息 → useGameRefresh

  // 以下代码已被提取到自定义 hooks 中：
  // - 定时刷新游戏信息 → useGameRefresh
  // - 游戏分组和排序 → useGamesGrouping
  // - 搜索逻辑 → useGameSearch

  // Handle search result click
  const handleSearchResultClick = (result: SearchResult) => {
    setMainTab(result.mainTab)
    if (result.type === 'steam-game' && result.status) {
      setActiveTab(result.status)
      // Scroll to the game after a short delay to allow tab switch
      setTimeout(() => {
        setHighlightId(result.id)
        setTimeout(() => setHighlightId(null), 2000)
      }, 100)
    }
  }

  const handleAddGameFromSteam = async (
    name: string,
    steamUrl: string,
    coverImage: string,
    _tags: string[],
    positivePercentage?: number,
    totalReviews?: number,
    releaseDate?: string,
    comingSoon?: boolean,
    isEarlyAccess?: boolean
  ) => {
    const existing = games.find((g) => g.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      showToast(`"${name}" 已经在队列中！`)
      setHighlightId(existing.id)
      // 重复的游戏仍然算作成功，因为游戏已存在，只是不需要再添加
      return
    }

    const newGame: Game = {
      id: Date.now().toString(),
      name,
      status: 'queueing',
      addedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      steamUrl,
      coverImage,
      positivePercentage,
      totalReviews,
      releaseDate,
      comingSoon,
      isEarlyAccess,
    }

    try {
      // 使用 concurrentUpdateGames 确保在添加时获取最新数据，避免覆盖他人更改
      const finalGames = await githubService.concurrentUpdateGames(
        (currentGames) => {
          // 再次检查是否已存在（防止并发添加）
          const duplicate = currentGames.find((g) => g.name.toLowerCase() === name.toLowerCase())
          if (duplicate) {
            throw new Error(`"${name}" 已经在队列中！`)
          }
          return [newGame, ...currentGames]
        },
        `Add game via web: ${name} (${steamUrl.split('/').pop()})`
      )

      setGames(finalGames)

      showToast(`从 Steam 添加了 "${name}"`)
      setHighlightId(newGame.id)

      // 如果没有好评率或发布日期数据，立即拉取
      if (
        positivePercentage === undefined ||
        positivePercentage === null ||
        totalReviews === undefined ||
        totalReviews === null ||
        !newGame.releaseDate ||
        isEarlyAccess === undefined ||
        isEarlyAccess === null
      ) {
        const match = steamUrl.match(/\/app\/(\d+)/)
        if (match) {
          const appId = parseInt(match[1])
          console.log(`正在获取 ${name} 的信息...`)

          try {
            const [reviews, releaseInfo] = await Promise.all([
              steamService.getGameReviews(appId),
              steamService.getGameReleaseDate(appId),
            ])

            if (
              reviews.positivePercentage !== null ||
              reviews.totalReviews !== null ||
              releaseInfo.releaseDate !== null ||
              releaseInfo.isEarlyAccess !== null
            ) {
              // 更新本地状态
              setGames((prevGames) =>
                prevGames.map((g) => {
                  if (g.id === newGame.id) {
                    // 使用最新的游戏状态，只更新好评率相关字段
                    return {
                      ...g,
                      positivePercentage: reviews.positivePercentage ?? positivePercentage,
                      totalReviews: reviews.totalReviews ?? totalReviews,
                      releaseDate: releaseInfo.releaseDate ?? g.releaseDate,
                      comingSoon: releaseInfo.comingSoon ?? g.comingSoon,
                      isEarlyAccess: releaseInfo.isEarlyAccess ?? g.isEarlyAccess,
                    }
                  }
                  return g
                })
              )

              // 保存更新到 GitHub
              try {
                await githubService.concurrentUpdateGames((currentGames) => {
                  return currentGames.map((g) => {
                    if (g.id === newGame.id) {
                      return {
                        ...g,
                        positivePercentage: reviews.positivePercentage ?? positivePercentage,
                        totalReviews: reviews.totalReviews ?? totalReviews,
                        releaseDate: releaseInfo.releaseDate ?? g.releaseDate,
                        comingSoon: releaseInfo.comingSoon ?? g.comingSoon,
                        isEarlyAccess: releaseInfo.isEarlyAccess ?? g.isEarlyAccess,
                      }
                    }
                    return g
                  })
                }, `Update game via web: ${name}`)

                console.log(
                  `已获取并保存 ${name} 的信息: 好评率 ${reviews.positivePercentage}%, 发布日期 ${releaseInfo.releaseDate}, 抢先体验 ${releaseInfo.isEarlyAccess}`
                )
              } catch (saveErr) {
                console.error(`保存 ${name} 信息到 GitHub 失败:`, saveErr)
              }
            }
          } catch (err) {
            console.error(`获取 ${name} 信息失败:`, err)
          }
        }
      }
    } catch (err) {
      console.error('Failed to add game:', err)
      showToast('添加游戏失败')
      setGames(games) // 回滚
      throw err // 重新抛出错误以便 SteamSearch 组件可以处理
    }
  }

  const handleUpdateGame = async (id: string, updates: Partial<Game>) => {
    const game = games.find((g) => g.id === id)
    if (!game) return

    try {
      const finalGames = await githubService.concurrentUpdateGames((currentGames) => {
        return currentGames.map((g) =>
          g.id === id ? { ...g, ...updates, lastUpdated: new Date().toISOString() } : g
        )
      }, `Update game via web: ${game.name}`)

      setGames(finalGames)
    } catch (err) {
      console.error('Failed to update game:', err)
      showToast('更新游戏失败')
      // 不需要回滚，因为我们没有提前更新本地状态
    }
  }

  const handleDeleteGame = async (id: string) => {
    const game = games.find((g) => g.id === id)
    if (!game) return

    try {
      const finalGames = await githubService.concurrentUpdateGames((currentGames) => {
        return currentGames.filter((g) => g.id !== id)
      }, `Remove game via web: ${game.name}`)

      setGames(finalGames)
      showToast(`移除了 "${game.name}"`)
    } catch (err) {
      console.error('Failed to delete game:', err)
      showToast('删除游戏失败')
    }
  }

  const handlePinGame = async (id: string) => {
    const game = games.find((g) => g.id === id)
    if (!game) return

    const newPinnedState = !game.isPinned

    try {
      const finalGames = await githubService.concurrentUpdateGames(
        (currentGames) => {
          return currentGames.map((g) =>
            g.id === id
              ? { ...g, isPinned: newPinnedState, lastUpdated: new Date().toISOString() }
              : g
          )
        },
        `${newPinnedState ? 'Pin' : 'Unpin'} game via web: ${game.name}`
      )

      setGames(finalGames)
      showToast(newPinnedState ? `已置顶 "${game.name}"` : `已取消置顶 "${game.name}"`)
    } catch (err) {
      console.error('Failed to pin game:', err)
      showToast('操作失败')
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term) {
      const match = games.find((g) => g.name.toLowerCase().includes(term.toLowerCase()))
      if (match) {
        setHighlightId(match.id)
      }
    }
  }

  const handleSettingsClose = () => {
    setShowSettings(false)
    // 重新加载游戏数据（如果配置已更新）
    if (githubService.isConfigured()) {
      githubService
        .fetchGames()
        .then((data) => setGames(data.games))
        .catch((err) => console.error('Failed to reload games:', err))
    }
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>GameGallery</h1>
        <div className={styles.headerActions}>
          <SearchBar
            value={searchTerm}
            onSearch={handleSearch}
            results={searchResults}
            onResultClick={handleSearchResultClick}
          />
          <button onClick={() => setShowSettings(true)} className={styles.btnSettings} title="设置">
            <SettingsIcon size={18} />
          </button>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className={styles.mainTabNav}>
        <button
          onClick={() => setMainTab('steamgames')}
          className={classNames(styles.mainTabBtn, {
            [styles.mainTabActive]: mainTab === 'steamgames',
          })}
        >
          <Library size={20} />
          Steam Games
        </button>
        <button
          onClick={() => setMainTab('playground')}
          className={classNames(styles.mainTabBtn, {
            [styles.mainTabActive]: mainTab === 'playground',
          })}
        >
          <Sparkles size={20} />
          Playground
        </button>
      </div>

      <main>
        {mainTab === 'playground' ? (
          <Suspense
            fallback={
              <div className={styles.loadingContainer}>
                <Loader2 className={`${styles.loaderIcon} animate-spin`} size={32} />
                <div className={styles.mt1}>加载中...</div>
              </div>
            }
          >
            <MiniGames onClose={() => {}} />
          </Suspense>
        ) : isLoading ? (
          <div className={styles.loadingContainer}>
            <Loader2 className={`${styles.loaderIcon} animate-spin`} size={32} />
            <div className={styles.mt1}>加载中...</div>
          </div>
        ) : (
          <div>
            {/* Tab Navigation with Add Button */}
            <div className={styles.tabNavRow}>
              <div className={styles.tabNav}>
                <button
                  data-status="playing"
                  onClick={() => setActiveTab('playing')}
                  className={classNames(styles.tabBtn, {
                    [styles.active]: activeTab === 'playing',
                    [styles.activePlaying]: activeTab === 'playing',
                  })}
                >
                  <Play size={16} />
                  Playing ({groupedGames.playing.length})
                </button>
                <button
                  data-status="queueing"
                  onClick={() => setActiveTab('queueing')}
                  className={classNames(styles.tabBtn, {
                    [styles.active]: activeTab === 'queueing',
                    [styles.activeQueueing]: activeTab === 'queueing',
                  })}
                >
                  <Bookmark size={16} />
                  Queueing ({groupedGames.queueing.length})
                </button>
                <button
                  data-status="completion"
                  onClick={() => setActiveTab('completion')}
                  className={classNames(styles.tabBtn, {
                    [styles.active]: activeTab === 'completion',
                    [styles.activeCompletion]: activeTab === 'completion',
                  })}
                >
                  <CheckCircle size={16} />
                  Completion ({groupedGames.completion.length})
                </button>
              </div>
              <button onClick={() => setShowSteamSearch(true)} className={styles.btnSteam}>
                从 Steam 添加
              </button>
            </div>

            {/* Game List */}
            <div className={styles.gameList}>
              <AnimatePresence mode="wait">
                {groupedGames[activeTab].length > 0 ? (
                  groupedGames[activeTab].map((game) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={styles.gameItemWrapper}
                    >
                      <GameItem
                        game={game}
                        onUpdate={handleUpdateGame}
                        onDelete={handleDeleteGame}
                        onPin={handlePinGame}
                        isHighlighted={highlightId === game.id}
                        onShowToast={showToast}
                      />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={styles.emptyState}
                  >
                    该状态下暂无游戏
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {showSteamSearch && (
        <Suspense fallback={<div />}>
          <SteamSearch
            onAddGame={handleAddGameFromSteam}
            onClose={() => setShowSteamSearch(false)}
          />
        </Suspense>
      )}

      {showSettings && (
        <Suspense fallback={<div />}>
          <Settings onClose={handleSettingsClose} />
        </Suspense>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={styles.toast}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
