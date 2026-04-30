/* 跟踪清单表格 */
import { useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import { fetchGz, loadDaily, removeWatchlist, updateWatchlistPosition } from '@services/api'
import type { DailyRow, GzData, WatchFund } from '@/types'
import { pct, pctClass } from '@/utils/format'
import shared from '@/styles/shared.module.scss'
import styles from './index.module.scss'

interface Props {
  funds: WatchFund[]
  showAdvancedPosition: boolean
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

function parsePositiveNumber(value: string): number | null {
  const raw = value.trim().replace(/,/g, '')
  if (!raw) return null
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
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

function getValuationPrice(
  gz: GzData | null | undefined,
  daily: DailyRow | null | undefined,
  previousDaily: DailyRow | null | undefined
) {
  const currentNav = toNumber(daily?.dwjz)
  if (currentNav != null) {
    return {
      value: currentNav,
      date: daily?.date || '',
    }
  }

  const estimatePrice = toNumber(gz?.gsz)
  if (estimatePrice != null) {
    return {
      value: estimatePrice,
      date: gz?.gztime || '',
    }
  }

  return {
    value: toNumber(previousDaily?.dwjz),
    date: previousDaily?.date || gz?.jzrq || '',
  }
}

function getNavPrice(
  gz: GzData | null | undefined,
  daily: DailyRow | null | undefined,
  previousDaily: DailyRow | null | undefined
) {
  const currentNav = toNumber(daily?.dwjz)
  if (currentNav != null) {
    return {
      value: currentNav,
      date: daily?.date || '',
    }
  }

  const realtimeNav = toNumber(gz?.dwjz)
  if (realtimeNav != null) {
    return {
      value: realtimeNav,
      date: gz?.jzrq || '',
    }
  }

  return {
    value: toNumber(previousDaily?.dwjz),
    date: previousDaily?.date || '',
  }
}

function getChangeAmount(
  holdingAmount: number | null | undefined,
  changePercent: string | null | undefined
) {
  const percent = toNumber(changePercent)
  if (holdingAmount == null || percent == null) return null
  return holdingAmount * (percent / 100)
}

function formatMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatValue(value: number | null | undefined, digits: number): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function moneyClass(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value === 0) return ''
  return value > 0 ? 'up' : 'down'
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

export default function Watchlist({ funds, showAdvancedPosition, onChange }: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingCode, setEditingCode] = useState('')
  const [amountDraft, setAmountDraft] = useState('')
  const [holdingPopoverCode, setHoldingPopoverCode] = useState('')
  const [sharesDraft, setSharesDraft] = useState('')
  const [costDraft, setCostDraft] = useState('')
  const [savingCode, setSavingCode] = useState('')
  const refreshRequestRef = useRef(0)
  const popoverCloseTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setRows(funds.map((f) => ({ fund: f })))
  }, [funds])

  useEffect(() => {
    void refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funds])

  useEffect(() => {
    return () => {
      if (popoverCloseTimerRef.current != null) {
        window.clearTimeout(popoverCloseTimerRef.current)
      }
    }
  }, [])

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

  function clearPopoverCloseTimer() {
    if (popoverCloseTimerRef.current != null) {
      window.clearTimeout(popoverCloseTimerRef.current)
      popoverCloseTimerRef.current = null
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

  function startCurrentValueEdit(e: React.MouseEvent, code: string, currentAmount: number | null) {
    e.stopPropagation()
    clearPopoverCloseTimer()
    setHoldingPopoverCode('')
    setSharesDraft('')
    setCostDraft('')
    setEditingCode(code)
    setAmountDraft(currentAmount != null ? currentAmount.toFixed(2) : '')
  }

  function cancelCurrentValueEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setEditingCode('')
    setAmountDraft('')
  }

  function openHoldingPopover(fund: WatchFund) {
    if (!showAdvancedPosition || savingCode || editingCode === fund.code) return
    clearPopoverCloseTimer()
    setHoldingPopoverCode(fund.code)
    setSharesDraft(
      fund.holding_shares != null && Number.isFinite(fund.holding_shares)
        ? String(fund.holding_shares)
        : ''
    )
    setCostDraft(
      fund.holding_cost_price != null && Number.isFinite(fund.holding_cost_price)
        ? String(fund.holding_cost_price)
        : ''
    )
  }

  function scheduleCloseHoldingPopover(code: string) {
    clearPopoverCloseTimer()
    popoverCloseTimerRef.current = window.setTimeout(() => {
      if (savingCode === code) return
      setHoldingPopoverCode((current) => (current === code ? '' : current))
      setSharesDraft('')
      setCostDraft('')
      popoverCloseTimerRef.current = null
    }, 120)
  }

  async function saveCurrentValuePosition(
    e: React.SyntheticEvent,
    fund: WatchFund,
    navPrice: number | null
  ) {
    e.stopPropagation()
    const raw = amountDraft.trim().replace(/,/g, '')
    if (!raw) {
      await clearCurrentValuePosition(e, fund)
      return
    }

    const amount = Number(raw)
    if (!Number.isFinite(amount) || amount < 0) {
      alert('请输入有效的当前持有金额')
      return
    }
    if (amount > 0 && (!navPrice || navPrice <= 0)) {
      alert('当前净值或估值不可用，暂时不能设置当前持有金额')
      return
    }

    try {
      setSavingCode(fund.code)
      await updateWatchlistPosition(fund.code, {
        holdingAmount: amount > 0 ? amount : null,
        navPrice,
      })
      setEditingCode('')
      setAmountDraft('')
      onChange?.()
    } catch (err) {
      alert('保存失败：' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSavingCode('')
    }
  }

  async function clearCurrentValuePosition(e: React.SyntheticEvent, fund: WatchFund) {
    e.stopPropagation()
    try {
      setSavingCode(fund.code)
      await updateWatchlistPosition(fund.code, {
        holdingAmount: null,
        navPrice: null,
      })
      setEditingCode('')
      setAmountDraft('')
      onChange?.()
    } catch (err) {
      alert('清空失败：' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSavingCode('')
    }
  }

  async function saveHoldingPosition(e: React.SyntheticEvent, fund: WatchFund) {
    e.stopPropagation()
    const shares = parsePositiveNumber(sharesDraft)
    const costPrice = parsePositiveNumber(costDraft)

    if (shares == null && costPrice == null) {
      setHoldingPopoverCode('')
      return
    }
    if (shares == null || costPrice == null) {
      alert('请同时输入有效的持有份额和持仓成本价')
      return
    }

    try {
      setSavingCode(fund.code)
      await updateWatchlistPosition(fund.code, {
        holdingShares: shares,
        holdingCostPrice: costPrice,
      })
      setHoldingPopoverCode('')
      setSharesDraft('')
      setCostDraft('')
      onChange?.()
    } catch (err) {
      alert('保存失败：' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSavingCode('')
    }
  }

  const totalProfit = rows.reduce<number | null>((total, { fund, gz, daily, previousDaily }) => {
    const holdingUnits = fund.holding_units ?? null
    if (holdingUnits == null) return total

    const navPrice = getNavPrice(gz, daily, previousDaily)
    if (navPrice.value == null) return total

    const currentChange = getCurrentChange(gz, daily)
    const marketValue = holdingUnits * navPrice.value
    const changeAmount = getChangeAmount(marketValue, currentChange.value)
    if (changeAmount == null) return total

    return (total ?? 0) + changeAmount
  }, null)
  const totalProfitState = moneyClass(totalProfit)

  return (
    <section className={shared.card}>
      <div className={shared.cardHead}>
        <h2>跟踪清单</h2>
        <div
          className={classNames(
            styles.totalProfit,
            totalProfitState ? styles[totalProfitState] : styles.flat
          )}
          title="按当前涨跌百分比和当前持有金额计算"
        >
          <span>总盈亏</span>
          <strong>
            {totalProfit != null && totalProfit > 0 ? '+' : ''}
            {formatMoney(totalProfit)}
          </strong>
        </div>
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
        <div className={styles.empty}>尚无跟踪基金，可使用上方搜索添加</div>
      ) : (
        <>
          {error && <div className={styles.inlineError}>{error}</div>}
          <div className={shared.tableScroll}>
            <table className={classNames(shared.dataTable, styles.watchTable)}>
              <colgroup>
                <col className={styles.codeCol} />
                <col className={styles.nameCol} />
                <col className={styles.prevChangeCol} />
                <col className={styles.currentChangeCol} />
                <col className={styles.positionCol} />
                <col className={styles.updateCol} />
                <col className={styles.actionCol} />
              </colgroup>
              <thead>
                <tr>
                  <th>代码</th>
                  <th>简称</th>
                  <th className="num">上交易日净值涨跌</th>
                  <th className="num">当前净值/估值涨跌</th>
                  <th className="num">当前持有</th>
                  <th className="num">更新</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ fund, gz, daily, previousDaily }) => {
                  const previousState = pctClass(previousDaily?.jzzzl)
                  const currentChange = getCurrentChange(gz, daily)
                  const currentState = pctClass(currentChange.value)
                  const valuationPrice = getValuationPrice(gz, daily, previousDaily)
                  const navPrice = getNavPrice(gz, daily, previousDaily)
                  const holdingUnits = fund.holding_units ?? null
                  const marketValue =
                    holdingUnits != null && navPrice.value != null
                      ? holdingUnits * navPrice.value
                      : null
                  const holdingShares = fund.holding_shares ?? null
                  const holdingCostPrice = fund.holding_cost_price ?? null
                  const costAmount =
                    fund.holding_amount ??
                    (holdingShares != null && holdingCostPrice != null
                      ? holdingShares * holdingCostPrice
                      : null)
                  const currentHolding = marketValue ?? costAmount
                  const holdingAmount =
                    fund.holding_amount ??
                    (holdingShares != null && holdingCostPrice != null
                      ? holdingShares * holdingCostPrice
                      : marketValue)
                  const holdingDelta = getChangeAmount(currentHolding, currentChange.value)
                  const holdingState = moneyClass(holdingDelta)
                  const holdingAmountPreview =
                    parsePositiveNumber(sharesDraft) != null &&
                    parsePositiveNumber(costDraft) != null
                      ? parsePositiveNumber(sharesDraft)! * parsePositiveNumber(costDraft)!
                      : null
                  const positionMeta = showAdvancedPosition
                    ? holdingShares != null && holdingCostPrice != null
                      ? `${formatValue(holdingShares, 2)} 份 · 成本 ¥${formatValue(holdingCostPrice, 4)}`
                      : '悬停设置份额 / 成本价'
                    : '点击编辑当前持有'
                  const isEditing = editingCode === fund.code
                  const isSaving = savingCode === fund.code
                  const isHoldingPopoverOpen =
                    showAdvancedPosition && holdingPopoverCode === fund.code

                  return (
                    <tr key={fund.code} onClick={() => go(fund.code)}>
                      <td>{fund.code}</td>
                      <td className={styles.nameCell}>{fund.name}</td>
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
                        <span className={styles.currentChangeGroup}>
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
                          {holdingDelta != null && (
                            <span
                              className={classNames(
                                styles.changeAmount,
                                holdingState ? styles[holdingState] : styles.flat
                              )}
                              title="按当前持有金额估算的变化"
                            >
                              {holdingDelta > 0 ? '+' : ''}
                              {formatMoney(holdingDelta)}
                            </span>
                          )}
                        </span>
                      </td>
                      <td
                        className={classNames('num', styles.positionCellTd)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isEditing ? (
                          <span className={styles.positionEditor}>
                            <input
                              value={amountDraft}
                              inputMode="decimal"
                              placeholder="10000"
                              aria-label={`${fund.name} 当前持有`}
                              onChange={(e) => setAmountDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  void saveCurrentValuePosition(e, fund, valuationPrice.value)
                                }
                                if (e.key === 'Escape') {
                                  setEditingCode('')
                                  setAmountDraft('')
                                }
                              }}
                            />
                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="保存当前持有"
                              disabled={isSaving}
                              onClick={(e) =>
                                void saveCurrentValuePosition(e, fund, valuationPrice.value)
                              }
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="取消"
                              disabled={isSaving}
                              onClick={cancelCurrentValueEdit}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ) : (
                          <div
                            className={styles.positionWrap}
                            onMouseEnter={() => openHoldingPopover(fund)}
                            onMouseLeave={() => scheduleCloseHoldingPopover(fund.code)}
                          >
                            <span className={styles.positionCell}>
                              <button
                                type="button"
                                className={styles.positionValue}
                                title={
                                  holdingShares != null && holdingCostPrice != null
                                    ? `${formatValue(holdingShares, 2)} 份 × ¥${formatValue(holdingCostPrice, 4)}`
                                    : navPrice.date
                                      ? `按基金净值 ${navPrice.value ?? '—'}（${navPrice.date}）计算`
                                      : undefined
                                }
                                onClick={(e) => startCurrentValueEdit(e, fund.code, currentHolding)}
                              >
                                <span>¥{formatMoney(currentHolding)}</span>
                                <em>{positionMeta}</em>
                              </button>
                              <button
                                type="button"
                                className={styles.iconBtn}
                                title={currentHolding != null ? '更新当前持有' : '设置当前持有'}
                                onClick={(e) => startCurrentValueEdit(e, fund.code, currentHolding)}
                              >
                                <Pencil size={12} />
                              </button>
                            </span>
                            {isHoldingPopoverOpen && (
                              <div
                                className={styles.holdingPopover}
                                onMouseEnter={clearPopoverCloseTimer}
                                onMouseLeave={() => scheduleCloseHoldingPopover(fund.code)}
                              >
                                <div className={styles.popoverTitle}>设置持有份额和成本价</div>
                                <label className={styles.popoverField}>
                                  <span>持有份额</span>
                                  <input
                                    value={sharesDraft}
                                    inputMode="decimal"
                                    placeholder="1000"
                                    aria-label={`${fund.name} 持有份额`}
                                    onChange={(e) => setSharesDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        void saveHoldingPosition(e, fund)
                                      }
                                      if (e.key === 'Escape') {
                                        setHoldingPopoverCode('')
                                      }
                                    }}
                                  />
                                </label>
                                <label className={styles.popoverField}>
                                  <span>持仓成本价</span>
                                  <input
                                    value={costDraft}
                                    inputMode="decimal"
                                    placeholder="1.2345"
                                    aria-label={`${fund.name} 持仓成本价`}
                                    onChange={(e) => setCostDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        void saveHoldingPosition(e, fund)
                                      }
                                      if (e.key === 'Escape') {
                                        setHoldingPopoverCode('')
                                      }
                                    }}
                                  />
                                </label>
                                <div className={styles.popoverHint}>
                                  预估持有金额：¥
                                  {formatMoney(holdingAmountPreview ?? holdingAmount)}
                                </div>
                                <div className={styles.popoverActions}>
                                  <button
                                    type="button"
                                    className={styles.iconBtn}
                                    title="保存份额和成本价"
                                    disabled={isSaving}
                                    onClick={(e) => void saveHoldingPosition(e, fund)}
                                  >
                                    <Check size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.iconBtn}
                                    title="关闭"
                                    disabled={isSaving}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setHoldingPopoverCode('')
                                    }}
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
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
