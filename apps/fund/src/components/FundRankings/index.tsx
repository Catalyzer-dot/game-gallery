import { useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import { addWatchlist, getSessionToken, loadRank, refreshRankCache } from '@services/api'
import type { RankPeriod, RankRow } from '@services/api'
import type { WatchFund } from '@/types'
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

const PERIOD_META: Record<RankPeriod, { metaLabel: (row: RankRow) => string }> = {
  estimate: { metaLabel: (r) => `估值日 ${shortDate(r.date)}` },
  previous_day: { metaLabel: (r) => `净值日 ${shortDate(r.date)}` },
  '30d': { metaLabel: (r) => `${shortDate(r.base_date)} 至 ${shortDate(r.latest_date)}` },
}

function RankList({
  rows,
  period,
  watchlist,
  onTrack,
  adding,
}: {
  rows: RankRow[]
  period: RankPeriod
  watchlist?: WatchFund[]
  onTrack?: (code: string, name: string) => void
  adding: string | null
}) {
  const loggedIn = !!getSessionToken()
  const { metaLabel } = PERIOD_META[period]
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
                  {metaLabel(row)}
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

const TAB_LABELS: Record<RankPeriod, string> = {
  estimate: '当前',
  previous_day: '上交易日',
  '30d': '近30天',
}

const PANEL_SUBTITLES: Record<RankPeriod, { gainers: string; losers: string }> = {
  estimate: { gainers: '盘中估值涨幅', losers: '盘中估值跌幅' },
  previous_day: { gainers: '真实净值涨幅', losers: '真实净值跌幅' },
  '30d': { gainers: '区间净值涨幅', losers: '区间净值跌幅' },
}

interface TabData {
  gainers: RankRow[]
  losers: RankRow[]
}

export default function FundRankings({ watchlist, onWatchlistChange }: Props) {
  const [tab, setTab] = useState<RankPeriod>('estimate')
  const [gainers, setGainers] = useState<RankRow[]>([])
  const [losers, setLosers] = useState<RankRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState('')
  const cacheRef = useRef<Partial<Record<RankPeriod, TabData>>>({})

  async function handleRefreshCache() {
    if (refreshing) return
    setRefreshing(true)
    setRefreshMsg('')
    try {
      await refreshRankCache()
      cacheRef.current = {}
      setRefreshMsg('刷新已在后台启动，约 2-3 分钟后生效')
    } catch {
      setRefreshMsg('刷新失败')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const cached = cacheRef.current[tab]
    if (cached) {
      setGainers(cached.gainers)
      setLosers(cached.losers)
      return
    }

    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [g, l] = await Promise.all([loadRank(tab, 'desc'), loadRank(tab, 'asc')])
        if (!cancelled) {
          cacheRef.current[tab] = { gainers: g, losers: l }
          setGainers(g)
          setLosers(l)
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
  }, [tab])

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

  const subtitles = PANEL_SUBTITLES[tab]

  return (
    <section className={shared.section}>
      <div className={styles.stickyHead}>
        <h2>基金排行</h2>
        <div className={styles.headerRight}>
          <div className={styles.tabs}>
            {(Object.keys(TAB_LABELS) as RankPeriod[]).map((key) => (
              <button
                key={key}
                type="button"
                className={classNames(styles.tab, tab === key && styles.tabActive)}
                onClick={() => setTab(key)}
              >
                {TAB_LABELS[key]}
              </button>
            ))}
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
      ) : (
        <div className={styles.rankPanels}>
          <div className={styles.rankPanel}>
            <div className={styles.panelHead}>
              <h3>涨幅 Top 10</h3>
              <span>{subtitles.gainers}</span>
            </div>
            {gainers.length ? (
              <RankList
                rows={gainers}
                period={tab}
                watchlist={watchlist}
                onTrack={handleTrack}
                adding={adding}
              />
            ) : (
              <div className={styles.status}>暂无数据</div>
            )}
          </div>
          <div className={styles.rankPanel}>
            <div className={styles.panelHead}>
              <h3>跌幅 Top 10</h3>
              <span>{subtitles.losers}</span>
            </div>
            {losers.length ? (
              <RankList
                rows={losers}
                period={tab}
                watchlist={watchlist}
                onTrack={handleTrack}
                adding={adding}
              />
            ) : (
              <div className={styles.status}>暂无数据</div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
