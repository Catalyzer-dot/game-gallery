import { useEffect, useState } from 'react'
import classNames from 'classnames'
import {
  addWatchlist,
  getSessionToken,
  loadEstimateLoserFunds,
  loadPreviousDayLoserFunds,
  loadTop30dFunds,
  loadTopPreviousDayFunds,
  refreshRankCache,
} from '@services/api'
import type { FundDailyRankRow, FundRankRow, WatchFund } from '@/types'
import { pct, pctClass } from '@/utils/format'
import shared from '@/styles/shared.module.scss'
import styles from './index.module.scss'

interface Props {
  watchlist?: WatchFund[]
  onWatchlistChange?: () => void
}

function shortDate(value?: string | null): string {
  if (!value) return '--'
  const parts = value.split('-')
  return parts.length === 3 ? `${parts[1]}-${parts[2]}` : value
}

function RankList({
  rows,
  variant,
  watchlist,
  onTrack,
  adding,
}: {
  rows: Array<FundRankRow | FundDailyRankRow>
  variant: '30d' | 'previous' | 'previous-loser' | 'estimate-loser'
  watchlist?: WatchFund[]
  onTrack?: (code: string, name: string) => void
  adding: string | null
}) {
  const loggedIn = !!getSessionToken()
  return (
    <ol className={styles.rankList}>
      {rows.map((row, index) => {
        const isTracked = watchlist?.some((w) => w.code === row.code) ?? false
        return (
          <li key={row.code} className={styles.rankRow}>
            <a href={`#/fund/${row.code}`} className={styles.rankItem}>
              <span className={styles.rankNo}>{index + 1}</span>
              <span className={styles.fundMain}>
                <span className={styles.fundTitle}>
                  <span className={styles.code}>{row.code}</span>
                  <strong>{row.name}</strong>
                </span>
                <span className={styles.meta}>
                  {variant === '30d'
                    ? `${shortDate((row as FundRankRow).base_date)} 至 ${shortDate((row as FundRankRow).latest_date)}`
                    : variant === 'estimate-loser'
                      ? `估值日 ${shortDate((row as FundDailyRankRow).date)}`
                      : `净值日 ${shortDate((row as FundDailyRankRow).date)}`}
                  {row.ftype && <span>{row.ftype}</span>}
                </span>
              </span>
              <span className={classNames(styles.returnBadge, pctClass(row.return_pct))}>
                {pct(row.return_pct)}
              </span>
            </a>
            {loggedIn && (
              <button
                type="button"
                className={classNames(styles.trackBtn, isTracked && styles.trackBtnTracked)}
                onClick={() => !isTracked && onTrack?.(row.code, row.name)}
                disabled={isTracked || adding === row.code}
                title={isTracked ? '已追踪' : '加入追踪'}
              >
                {isTracked ? '✓' : adding === row.code ? '…' : '+'}
              </button>
            )}
          </li>
        )
      })}
    </ol>
  )
}

type RankTab = 'gainers' | 'losers'

export default function FundRankings({ watchlist, onWatchlistChange }: Props) {
  const [tab, setTab] = useState<RankTab>('gainers')
  const [top30d, setTop30d] = useState<FundRankRow[]>([])
  const [topPreviousDay, setTopPreviousDay] = useState<FundDailyRankRow[]>([])
  const [previousDayLosers, setPreviousDayLosers] = useState<FundDailyRankRow[]>([])
  const [estimateLosers, setEstimateLosers] = useState<FundDailyRankRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState('')

  async function handleRefreshCache() {
    if (refreshing) return
    setRefreshing(true)
    setRefreshMsg('')
    try {
      await refreshRankCache()
      setRefreshMsg('刷新已在后台启动，约 2-3 分钟后生效')
    } catch {
      setRefreshMsg('刷新失败')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [rank30d, rankPreviousDay, rankPrevLosers, rankEstLosers] = await Promise.all([
          loadTop30dFunds(10),
          loadTopPreviousDayFunds(10),
          loadPreviousDayLoserFunds(10),
          loadEstimateLoserFunds(10),
        ])
        if (!cancelled) {
          setTop30d(rank30d)
          setTopPreviousDay(rankPreviousDay)
          setPreviousDayLosers(rankPrevLosers)
          setEstimateLosers(rankEstLosers)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleTrack(code: string, name: string) {
    if (adding) return
    setAdding(code)
    try {
      await addWatchlist(code, name)
      onWatchlistChange?.()
    } finally {
      setAdding(null)
    }
  }

  return (
    <section className={shared.section}>
      <div className={styles.stickyHead}>
        <h2>基金排行</h2>
        <div className={styles.headerRight}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={classNames(styles.tab, tab === 'gainers' && styles.tabActive)}
              onClick={() => setTab('gainers')}
            >
              涨幅榜
            </button>
            <button
              type="button"
              className={classNames(styles.tab, tab === 'losers' && styles.tabActive)}
              onClick={() => setTab('losers')}
            >
              跌幅榜
            </button>
          </div>
          {refreshMsg && <span className="muted small">{refreshMsg}</span>}
          {getSessionToken() && (
            <button
              type="button"
              className={shared.ghostBtn}
              onClick={handleRefreshCache}
              disabled={refreshing}
            >
              {refreshing ? '刷新中...' : '刷新缓存'}
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <div className={styles.status}>加载排行中...</div>
      ) : error ? (
        <div className={styles.error}>排行暂不可用：{error}</div>
      ) : tab === 'gainers' ? (
        <div className={styles.rankPanels}>
          <div className={styles.rankPanel}>
            <div className={styles.panelHead}>
              <h3>上交易日 Top 10</h3>
              <span>真实净值涨幅</span>
            </div>
            {topPreviousDay.length ? (
              <RankList
                rows={topPreviousDay}
                variant="previous"
                watchlist={watchlist}
                onTrack={handleTrack}
                adding={adding}
              />
            ) : (
              <div className={styles.status}>暂无上交易日净值数据</div>
            )}
          </div>
          <div className={styles.rankPanel}>
            <div className={styles.panelHead}>
              <h3>近 30 天 Top 10</h3>
              <span>区间净值涨幅</span>
            </div>
            {top30d.length ? (
              <RankList
                rows={top30d}
                variant="30d"
                watchlist={watchlist}
                onTrack={handleTrack}
                adding={adding}
              />
            ) : (
              <div className={styles.status}>暂无足够 30 天净值数据</div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.rankPanels}>
          <div className={styles.rankPanel}>
            <div className={styles.panelHead}>
              <h3>上交易日跌幅 Top 10</h3>
              <span>真实净值跌幅</span>
            </div>
            {previousDayLosers.length ? (
              <RankList
                rows={previousDayLosers}
                variant="previous-loser"
                watchlist={watchlist}
                onTrack={handleTrack}
                adding={adding}
              />
            ) : (
              <div className={styles.status}>暂无上交易日跌幅数据</div>
            )}
          </div>
          <div className={styles.rankPanel}>
            <div className={styles.panelHead}>
              <h3>当前估值跌幅 Top 10</h3>
              <span>盘中估值跌幅</span>
            </div>
            {estimateLosers.length ? (
              <RankList
                rows={estimateLosers}
                variant="estimate-loser"
                watchlist={watchlist}
                onTrack={handleTrack}
                adding={adding}
              />
            ) : (
              <div className={styles.status}>暂无当前估值跌幅数据</div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
