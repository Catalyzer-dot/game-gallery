import { useCallback, useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import Watchlist from '@components/Watchlist'
import Search from '@components/Search'
import FundRankings from '@components/FundRankings'
import { getSessionToken, isUnauthorizedError, loadWatchlist } from '@services/api'
import type { WatchFund } from '@/types'
import shared from '@/styles/shared.module.scss'

const REPO_URL = 'https://github.com/Catalyzer-dot/game-gallery/tree/main/apps/fund'

export default function Home() {
  const [watchlist, setWatchlist] = useState<WatchFund[]>([])
  const [authRequired, setAuthRequired] = useState(false)

  const reload = useCallback(async () => {
    if (!getSessionToken()) {
      setWatchlist([])
      setAuthRequired(true)
      return
    }

    try {
      setWatchlist(await loadWatchlist())
      setAuthRequired(false)
    } catch (error) {
      setWatchlist([])
      setAuthRequired(isUnauthorizedError(error))
    }
  }, [])

  useEffect(() => {
    // 初次加载触发拉数据；setState 在异步 reload 内部，可接受
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [reload])

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1>Fund Tracker</h1>
        <div className={shared.meta}>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            repo <ExternalLink size={11} style={{ verticalAlign: 'middle' }} />
          </a>
        </div>
      </header>

      <main className={shared.main}>
        {authRequired ? (
          <div className={shared.statusBox}>
            fund 跟踪清单已按登录用户隔离。请先登录后再查看或维护自己的基金列表。
            <a href="/" style={{ marginLeft: 10 }}>
              去登录
            </a>
          </div>
        ) : (
          <>
            <FundRankings />
            <Search watchlist={watchlist} onWatchlistChange={reload} />
            <Watchlist funds={watchlist} onChange={reload} />
          </>
        )}
      </main>

      <footer className={shared.footer}>
        数据：天天基金 / 新浪财经（公开行情）。仅供参考，不构成投资建议。
      </footer>
    </div>
  )
}
