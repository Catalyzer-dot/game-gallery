import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { loadTop30dFunds, loadTopPreviousDayFunds } from '@services/api'
import type { FundDailyRankRow, FundRankRow } from '@/types'
import { pct, pctClass } from '@/utils/format'
import shared from '@/styles/shared.module.scss'
import styles from './index.module.scss'

function shortDate(value?: string | null): string {
  if (!value) return '--'
  const parts = value.split('-')
  return parts.length === 3 ? `${parts[1]}-${parts[2]}` : value
}

function RankList({
  rows,
  variant,
}: {
  rows: Array<FundRankRow | FundDailyRankRow>
  variant: '30d' | 'previous'
}) {
  return (
    <ol className={styles.rankList}>
      {rows.map((row, index) => (
        <li key={row.code}>
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
                  : `净值日 ${shortDate((row as FundDailyRankRow).date)}`}
                {row.ftype && <span>{row.ftype}</span>}
              </span>
            </span>
            <span className={classNames(styles.returnBadge, pctClass(row.return_pct))}>
              {pct(row.return_pct)}
            </span>
          </a>
        </li>
      ))}
    </ol>
  )
}

export default function FundRankings() {
  const [top30d, setTop30d] = useState<FundRankRow[]>([])
  const [topPreviousDay, setTopPreviousDay] = useState<FundDailyRankRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [rank30d, rankPreviousDay] = await Promise.all([
          loadTop30dFunds(10),
          loadTopPreviousDayFunds(10),
        ])
        if (!cancelled) {
          setTop30d(rank30d)
          setTopPreviousDay(rankPreviousDay)
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

  return (
    <section className={shared.card}>
      <div className={shared.cardHead}>
        <h2>基金涨幅排行</h2>
        <span className="muted small">基于已缓存真实净值</span>
      </div>
      {loading ? (
        <div className={styles.status}>加载排行中...</div>
      ) : error ? (
        <div className={styles.error}>排行暂不可用：{error}</div>
      ) : (
        <div className={styles.rankPanels}>
          <div className={styles.rankPanel}>
            <div className={styles.panelHead}>
              <h3>上交易日 Top 10</h3>
              <span>真实净值涨幅</span>
            </div>
            {topPreviousDay.length ? (
              <RankList rows={topPreviousDay} variant="previous" />
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
              <RankList rows={top30d} variant="30d" />
            ) : (
              <div className={styles.status}>暂无足够 30 天净值数据</div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
