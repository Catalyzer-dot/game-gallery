import { useCallback, useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import Settings from '@components/Settings'
import Watchlist from '@components/Watchlist'
import Search from '@components/Search'
import FundRankings from '@components/FundRankings'
import {
  getSessionToken,
  isUnauthorizedError,
  loadFundPortfolio,
  loadWatchlist,
} from '@services/api'
import type { FundPortfolio, WatchFund } from '@/types'
import shared from '@/styles/shared.module.scss'

const REPO_URL = 'https://github.com/Catalyzer-dot/degenerates-frontend/tree/main/apps/fund'
const ADVANCED_POSITION_KEY = 'fund_tracker_show_advanced_position'

export default function Home() {
  const [watchlist, setWatchlist] = useState<WatchFund[]>([])
  const [portfolio, setPortfolio] = useState<FundPortfolio | null>(null)
  const [authRequired, setAuthRequired] = useState(false)
  const [showAdvancedPosition, setShowAdvancedPosition] = useState(() => {
    return window.localStorage.getItem(ADVANCED_POSITION_KEY) === '1'
  })

  const reload = useCallback(async () => {
    if (!getSessionToken()) {
      setWatchlist([])
      setPortfolio(null)
      setAuthRequired(true)
      return
    }

    try {
      const [nextWatchlist, nextPortfolio] = await Promise.all([
        loadWatchlist(),
        loadFundPortfolio(),
      ])
      setWatchlist(nextWatchlist)
      setPortfolio(nextPortfolio)
      setAuthRequired(false)
    } catch (error) {
      setWatchlist([])
      setPortfolio(null)
      setAuthRequired(isUnauthorizedError(error))
    }
  }, [])

  useEffect(() => {
    // 初次加载触发拉数据；setState 在异步 reload 内部，可接受
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [reload])

  useEffect(() => {
    window.localStorage.setItem(ADVANCED_POSITION_KEY, showAdvancedPosition ? '1' : '0')
  }, [showAdvancedPosition])

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1>Fund Tracker</h1>
        <Search watchlist={watchlist} onWatchlistChange={reload} inline />
        <div className={shared.meta}>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            repo <ExternalLink size={11} style={{ verticalAlign: 'middle' }} />
          </a>
          <Settings
            showAdvancedPosition={showAdvancedPosition}
            onToggleAdvancedPosition={() => setShowAdvancedPosition((value) => !value)}
          />
        </div>
      </header>

      <main className={shared.main}>
        {authRequired ? (
          <div className={shared.statusBox}>
            请点击右上角设置按钮登录，即可查看和管理你的基金跟踪清单。
          </div>
        ) : (
          <>
            <FundRankings />
            {watchlist.length === 0 ? (
              <div className={shared.statusBox}>
                暂无跟踪数据，使用上方搜索框添加你想关注的基金。
              </div>
            ) : (
              <Watchlist
                funds={watchlist}
                portfolio={portfolio}
                onChange={reload}
                showAdvancedPosition={showAdvancedPosition}
              />
            )}
          </>
        )}
      </main>

      <footer className={shared.footer}>
        数据：天天基金 / 新浪财经（公开行情）。仅供参考，不构成投资建议。
      </footer>
    </div>
  )
}
