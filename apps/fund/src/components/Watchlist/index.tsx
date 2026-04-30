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
  previousDaily?: DailyRow | null
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

function withDerivedChange(row: DailyRow | undefined, previous: DailyRow | undefined) {
  if (!row) return null
  if (row.jzzzl) return row

  const prev = toNumber(previous?.dwjz)
  const current = toNumber(row.dwjz)
  if (!prev || current == null) return row

  return {
    ...row,
    jzzzl: (((current - prev) / prev) * 100).toFixed(2),
  }
}

function getCurrentChange(gz: GzData | null | undefined, daily: DailyRow | null | undefined) {
  const hasTodayNav = Boolean(daily?.jzzzl && daily.date === getTodayDateString())
  if (hasTodayNav) {
    return {
      value: daily?.jzzzl || '',
      label: '净值',
      time: daily?.date || '',
    }
  }

  return {
    value: gz?.gszzl || '',
    label: gz?.gszzl ? '估值' : '',
    time: gz?.gztime || '',
  }
}

async function fetchWatchlistSnapshot(fund: WatchFund): Promise<Row> {
  const [gz, daily] = await Promise.all([fetchGz(fund.code), loadDaily(fund.code, 3)])
  const latestRows = [...(daily?.rows || [])].sort((a, b) => b.date.localeCompare(a.date))
  const latest = withDerivedChange(latestRows[0], latestRows[1])
  const previous = withDerivedChange(latestRows[1], latestRows[2])
  const hasTodayNav = latest?.dwjz && latest.date === getTodayDateString()
  const currentDaily = hasTodayNav ? latest : null
  const previousDaily = hasTodayNav ? previous : latest
  const prevNet = previous?.dwjz || gz?.dwjz || ''
  const latestNet = currentDaily?.dwjz || ''

  if (!currentDaily?.dwjz) {
    return { fund, gz, daily: currentDaily, previousDaily }
  }

  return {
    fund,
    gz: {
      fundcode: gz?.fundcode || fund.code,
      name: gz?.name || fund.name,
      jzrq: previous?.date || gz?.jzrq || '',
      dwjz: prevNet,
      gsz: latestNet,
      gszzl: gz?.gszzl || '',
      gztime: `${currentDaily.date} 15:00`,
    },
    daily: currentDaily,
    previousDaily,
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
      if (results.some((r) => r.gz === null && r.previousDaily === null)) {
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
                  <th className="num">上交易日净值涨跌</th>
                  <th className="num">当前净值/估值涨跌</th>
                  <th className="num">更新</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ fund, gz, daily, previousDaily }) => {
                  const previousState = pctClass(previousDaily?.jzzzl)
                  const currentChange = getCurrentChange(gz, daily)
                  const currentState = pctClass(currentChange.value)
                  return (
                    <tr key={fund.code} onClick={() => go(fund.code)}>
                      <td>{fund.code}</td>
                      <td>{fund.name}</td>
                      <td className="num">
                        <span
                          title={previousDaily?.date ? `净值日期 ${previousDaily.date}` : undefined}
                          className={classNames(
                            styles.changeBadge,
                            previousState ? styles[previousState] : styles.flat
                          )}
                        >
                          {pct(previousDaily?.jzzzl)}
                        </span>
                      </td>
                      <td className="num">
                        <span className={styles.currentChange}>
                          <span
                            title={
                              currentChange.time
                                ? `${currentChange.label || '数据'}时间 ${currentChange.time}`
                                : undefined
                            }
                            className={classNames(
                              styles.changeBadge,
                              currentState ? styles[currentState] : styles.flat
                            )}
                          >
                            {pct(currentChange.value)}
                          </span>
                          {currentChange.label && (
                            <span
                              className={classNames(
                                styles.changeTag,
                                currentChange.label === '估值' ? styles.estimateTag : styles.navTag
                              )}
                            >
                              {currentChange.label}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="num muted">{(currentChange.time || '').slice(-5) || '—'}</td>
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
