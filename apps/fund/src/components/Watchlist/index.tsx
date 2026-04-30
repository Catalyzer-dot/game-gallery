/* 跟踪清单表格 */
import { useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import { Trash2 } from 'lucide-react'
import { fetchGz, loadDaily, removeWatchlist } from '@services/api'
import type { DailyRow, GzData, WatchFund } from '@/types'
import { pct, pctClass } from '@/utils/format'
import shared from '@/styles/shared.module.scss'
import styles from './index.module.scss'

interface Props {
  funds: WatchFund[]
  /** 当 watchlist 本身（增/删）变化时触发上层 reload */
  onChange?: () => void
}

interface Row {
  fund: WatchFund
  gz?: GzData | null
  daily?: DailyRow | null
}

function toNumber(value: string | null | undefined): number | null {
  if (!value) return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function fetchWatchlistSnapshot(fund: WatchFund): Promise<Row> {
  const [gz, daily] = await Promise.all([fetchGz(fund.code), loadDaily(fund.code, 2)])
  const latestRows = [...(daily?.rows || [])].sort((a, b) => b.date.localeCompare(a.date))
  const latest = latestRows[0]
  const previous = latestRows[1]
  const prevNet = previous?.dwjz || gz?.dwjz || ''
  const latestNet = latest?.dwjz || ''
  const derivedChange =
    latest?.jzzzl ||
    (() => {
      const prev = toNumber(prevNet)
      const current = toNumber(latestNet)
      if (!prev || current == null) return ''
      return (((current - prev) / prev) * 100).toFixed(2)
    })()
  const latestDaily = latest
    ? {
        ...latest,
        jzzzl: derivedChange,
      }
    : null

  if (!latest?.dwjz || latest.date !== getTodayDateString()) {
    return { fund, gz, daily: latestDaily }
  }

  return {
    fund,
    gz: {
      fundcode: gz?.fundcode || fund.code,
      name: gz?.name || fund.name,
      jzrq: previous?.date || gz?.jzrq || '',
      dwjz: prevNet,
      gsz: latestNet,
      gszzl: derivedChange,
      gztime: `${latest.date} 15:00`,
    },
    daily: latestDaily,
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = []
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await mapper(items[currentIndex])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return results
}

export default function Watchlist({ funds, onChange }: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const refreshRequestRef = useRef(0)

  useEffect(() => {
    setRows(funds.map((f) => ({ fund: f })))
  }, [funds])

  useEffect(() => {
    void refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funds])

  async function refreshAll() {
    const requestId = refreshRequestRef.current + 1
    refreshRequestRef.current = requestId
    setLoading(true)
    setError('')
    try {
      const results = await mapWithConcurrency(funds, 4, fetchWatchlistSnapshot)
      if (refreshRequestRef.current !== requestId) return
      setRows(results)
      if (results.some((r) => r.gz === null || r.daily === null)) {
        setError('部分实时估值或真实净值暂时不可用')
      }
    } catch (e) {
      if (refreshRequestRef.current !== requestId) return
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (refreshRequestRef.current === requestId) {
        setLoading(false)
      }
    }
  }

  function go(code: string) {
    window.location.hash = `#/fund/${code}`
  }

  async function handleRemove(e: React.MouseEvent, code: string, name: string) {
    e.stopPropagation()
    if (!confirm(`移除跟踪：${name} (${code})？`)) return
    try {
      await removeWatchlist(code)
      onChange?.()
    } catch (err) {
      alert('移除失败：' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <section className={shared.card}>
      <div className={shared.cardHead}>
        <h2>跟踪清单</h2>
        <button
          type="button"
          className={shared.ghostBtn}
          onClick={() => void refreshAll()}
          disabled={loading}
        >
          {loading ? '刷新中…' : '手动刷新'}
        </button>
      </div>
      {!funds.length ? (
        <div className={styles.empty}>尚无跟踪基金，使用下方搜索添加</div>
      ) : (
        <>
          {error && <div className={styles.inlineError}>{error}</div>}
          <div className={shared.tableScroll}>
            <table className={shared.dataTable}>
              <thead>
                <tr>
                  <th>代码</th>
                  <th>简称</th>
                  <th className="num">上日净值</th>
                  <th className="num">估值</th>
                  <th className="num">净值涨跌</th>
                  <th className="num">更新</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ fund, gz, daily }) => {
                  const changeState = pctClass(daily?.jzzzl)
                  return (
                    <tr key={fund.code} onClick={() => go(fund.code)}>
                      <td>{fund.code}</td>
                      <td>{fund.name}</td>
                      <td className="num">{gz?.dwjz || '—'}</td>
                      <td className="num">{gz?.gsz || '—'}</td>
                      <td className="num">
                        <span
                          title={daily?.date ? `净值日期 ${daily.date}` : undefined}
                          className={classNames(
                            styles.changeBadge,
                            changeState ? styles[changeState] : styles.flat
                          )}
                        >
                          {pct(daily?.jzzzl)}
                        </span>
                      </td>
                      <td className="num muted">{(gz?.gztime || '').slice(-5) || '—'}</td>
                      <td className="num">
                        <button
                          type="button"
                          className={styles.removeBtn}
                          title="移除跟踪"
                          aria-label={`移除跟踪 ${fund.name}`}
                          onClick={(e) => void handleRemove(e, fund.code, fund.name)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
