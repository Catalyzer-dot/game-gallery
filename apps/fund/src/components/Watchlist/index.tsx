/* 跟踪清单表格 */
import { useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import { Check, Minus, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  fetchGz,
  loadDaily,
  removeWatchlist,
  transactWatchlistPosition,
  updateWatchlistPosition,
} from '@services/api'
import type { DailyRow, FundPortfolio, GzData, WatchFund } from '@/types'
import { pct, pctClass } from '@/utils/format'
import shared from '@/styles/shared.module.scss'
import styles from './index.module.scss'

interface Props {
  funds: WatchFund[]
  portfolio: FundPortfolio | null
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

type PositionEditMode = 'set' | 'buy' | 'sell'

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
  // 优先：今日已有真实净值
  if (daily?.dwjz && daily.date === getTodayDateString()) {
    return {
      value: daily.jzzzl || '',
      label: '净值',
      time: daily.date,
    }
  }

  // 次选：今日有估值
  const gzDate = gz?.gztime?.slice(0, 10)
  if (gz?.gszzl && gzDate === getTodayDateString()) {
    return {
      value: gz.gszzl,
      label: '估值',
      time: gz.gztime,
    }
  }

  // 非交易日或数据未就绪 → 不显示
  return { value: '', label: '', time: '' }
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

function getCurrentValuationPrice(
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

  const gzDate = gz?.gztime?.slice(0, 10)
  const estimatePrice = gzDate === getTodayDateString() ? toNumber(gz?.gsz) : null
  if (estimatePrice != null) {
    return {
      value: estimatePrice,
      date: gz?.gztime || '',
    }
  }

  return getNavPrice(gz, daily, previousDaily)
}

function getDailyProfitFromEndingAmount(
  endingAmount: number | null | undefined,
  changePercent: string | null | undefined
) {
  const percent = toNumber(changePercent)
  if (endingAmount == null || percent == null) return null
  if (percent <= -100) return null
  return endingAmount * (percent / (100 + percent))
}

function getPositionBasis(fund: WatchFund) {
  const shares = fund.holding_shares ?? fund.holding_units ?? null
  const costPrice = fund.holding_cost_price ?? null
  const costAmount = shares != null && costPrice != null ? shares * costPrice : null
  return { shares, costPrice, costAmount }
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
  const latest = latestRows[0] ? withDerivedChange(latestRows[0], latestRows[1]) : undefined
  const previous = latestRows[1] ? withDerivedChange(latestRows[1], latestRows[2]) : undefined
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
  const [editMode, setEditMode] = useState<PositionEditMode>('set')
  const [amountDraft, setAmountDraft] = useState('')
  const [holdingPopoverCode, setHoldingPopoverCode] = useState('')
  const [sharesDraft, setSharesDraft] = useState('')
  const [costDraft, setCostDraft] = useState('')
  const [savingCode, setSavingCode] = useState('')
  const refreshRequestRef = useRef(0)
  const popoverCloseTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setRows((prev) => {
      const prevMap = new Map(prev.map((r) => [r.fund.code, r]))
      return funds.map((f) => {
        const existing = prevMap.get(f.code)
        return existing ? { ...existing, fund: f } : { fund: f }
      })
    })
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
      const results = await mapWithConcurrency(funds, 4, async (fund) => {
        try {
          return await fetchWatchlistSnapshot(fund)
        } catch {
          return { fund } as Row
        }
      })
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

  function startEdit(e: React.MouseEvent, code: string, currentAmount: number | null) {
    e.stopPropagation()
    clearPopoverCloseTimer()
    setHoldingPopoverCode('')
    setSharesDraft('')
    setCostDraft('')
    setEditingCode(code)
    setEditMode('set')
    setAmountDraft(currentAmount != null ? currentAmount.toFixed(2) : '')
  }

  function cancelCurrentValueEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setEditingCode('')
    setEditMode('set')
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
    if (!raw && editMode === 'set') {
      await clearCurrentValuePosition(e, fund)
      return
    }
    if (!raw) {
      alert('买入/卖出金额必须大于 0')
      return
    }

    const amount = Number(raw)
    if (!Number.isFinite(amount) || amount < 0) {
      alert('请输入有效的当前持有金额')
      return
    }
    if (amount <= 0 && editMode !== 'set') {
      alert('买入/卖出金额必须大于 0')
      return
    }
    if (amount > 0 && (!navPrice || navPrice <= 0)) {
      alert('当前净值不可用，暂时不能设置当前持有金额')
      return
    }

    try {
      setSavingCode(fund.code)
      if (editMode === 'set') {
        await updateWatchlistPosition(fund.code, {
          holdingAmount: amount > 0 ? amount : null,
          navPrice,
        })
      } else {
        await transactWatchlistPosition(fund.code, editMode, amount, navPrice as number)
      }
      setEditingCode('')
      setEditMode('set')
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
      setEditMode('set')
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

  const totalPreviousProfit = rows.reduce<number | null>((total, { fund, previousDaily }) => {
    const { shares } = getPositionBasis(fund)
    if (shares == null || !previousDaily?.dwjz) return total
    const previousHoldingAmount = shares * Number(previousDaily.dwjz)
    const profit = getDailyProfitFromEndingAmount(previousHoldingAmount, previousDaily.jzzzl)
    if (profit == null) return total
    return (total ?? 0) + profit
  }, null)
  const totalPreviousProfitState = moneyClass(totalPreviousProfit)
  const totalCurrentProfit = rows.reduce<number | null>(
    (total, { fund, gz, daily, previousDaily }) => {
      const currentChange = getCurrentChange(gz, daily)
      if (!currentChange.value) return total
      const { shares } = getPositionBasis(fund)
      let currentAmount: number | null = null
      if (shares != null) {
        const valuationPrice = getCurrentValuationPrice(gz, daily, previousDaily)
        if (valuationPrice.value != null) currentAmount = shares * valuationPrice.value
      } else if (fund.holding_amount != null) {
        currentAmount = fund.holding_amount
      }
      if (currentAmount == null) return total
      const profit = getDailyProfitFromEndingAmount(currentAmount, currentChange.value)
      if (profit == null) return total
      return (total ?? 0) + profit
    },
    null
  )
  const totalCurrentProfitState = moneyClass(totalCurrentProfit)

  return (
    <section className={shared.card}>
      <div className={shared.cardHead}>
        <h2>跟踪清单</h2>
        <div className={styles.summaryGroup}>
          <div
            className={classNames(
              styles.totalCost,
              totalPreviousProfitState ? styles[totalPreviousProfitState] : styles.flat
            )}
            title="按上一交易日净值涨跌和持有份额合计"
          >
            <span>上日盈亏</span>
            <strong>
              {totalPreviousProfit != null && totalPreviousProfit > 0 ? '+' : ''}
              {formatMoney(totalPreviousProfit)}
            </strong>
          </div>
          <div
            className={classNames(
              styles.totalCost,
              totalCurrentProfitState ? styles[totalCurrentProfitState] : styles.flat
            )}
            title="按当前净值/估值涨跌和持有份额合计"
          >
            <span>今日涨跌</span>
            <strong>
              {totalCurrentProfit != null && totalCurrentProfit > 0 ? '+' : ''}
              {formatMoney(totalCurrentProfit)}
            </strong>
          </div>
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
          <div className={classNames(shared.tableScroll, styles.watchTableWrap)}>
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
                  const navPrice = getNavPrice(gz, daily, previousDaily)
                  const valuationPrice = getCurrentValuationPrice(gz, daily, previousDaily)
                  const { shares, costPrice, costAmount } = getPositionBasis(fund)
                  const holdingAmount =
                    shares != null && navPrice.value != null ? shares * navPrice.value : null
                  const currentHoldingAmount =
                    shares != null && valuationPrice.value != null
                      ? shares * valuationPrice.value
                      : (fund.holding_amount ?? null)
                  const currentProfit = getDailyProfitFromEndingAmount(
                    currentHoldingAmount,
                    currentChange.value
                  )
                  const currentProfitState = moneyClass(currentProfit)
                  const totalPositionProfit =
                    holdingAmount != null && costAmount != null ? holdingAmount - costAmount : null
                  const holdingAmountPreview =
                    parsePositiveNumber(sharesDraft) != null &&
                    parsePositiveNumber(costDraft) != null
                      ? parsePositiveNumber(sharesDraft)! * parsePositiveNumber(costDraft)!
                      : null
                  const positionMeta = showAdvancedPosition
                    ? shares != null && costPrice != null
                      ? `${formatValue(shares, 2)} 份 · 成本 ¥${formatValue(costPrice, 4)}`
                      : '悬停设置份额 / 成本价'
                    : ''
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
                          <span
                            className={classNames(
                              styles.changeTag,
                              !currentChange.label && styles.changePlaceholder,
                              currentChange.label === '估值' ? styles.estimateTag : styles.navTag
                            )}
                          >
                            {currentChange.label || '—'}
                          </span>
                          <span
                            className={classNames(
                              styles.changeAmount,
                              currentProfit == null && styles.changePlaceholder,
                              currentProfitState ? styles[currentProfitState] : styles.flat
                            )}
                            title={
                              currentProfit != null
                                ? '按当前净值/估值涨跌和持有份额计算'
                                : undefined
                            }
                          >
                            {currentProfit != null
                              ? `${currentProfit > 0 ? '+' : ''}${formatMoney(currentProfit)}`
                              : '—'}
                          </span>
                        </span>
                      </td>
                      <td
                        className={classNames('num', styles.positionCellTd)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isEditing ? (
                          <span className={styles.positionEditor}>
                            <span className={styles.tradeModeGroup}>
                              <button
                                type="button"
                                className={classNames(
                                  styles.tradeModeBtn,
                                  editMode === 'set' && styles.activeMode
                                )}
                                onClick={() => {
                                  setEditMode('set')
                                  setAmountDraft(
                                    holdingAmount != null ? holdingAmount.toFixed(2) : ''
                                  )
                                }}
                              >
                                持有
                              </button>
                              <button
                                type="button"
                                className={classNames(
                                  styles.tradeModeBtn,
                                  editMode === 'buy' && styles.activeMode
                                )}
                                title="按最新真实净值买入"
                                onClick={() => {
                                  setEditMode('buy')
                                  setAmountDraft('')
                                }}
                              >
                                <Plus size={12} />
                              </button>
                              <button
                                type="button"
                                className={classNames(
                                  styles.tradeModeBtn,
                                  editMode === 'sell' && styles.activeMode
                                )}
                                title="按最新真实净值卖出"
                                onClick={() => {
                                  setEditMode('sell')
                                  setAmountDraft('')
                                }}
                              >
                                <Minus size={12} />
                              </button>
                            </span>
                            <input
                              value={amountDraft}
                              inputMode="decimal"
                              placeholder={editMode === 'set' ? '持有金额' : '交易金额'}
                              aria-label={`${fund.name} ${editMode === 'set' ? '持有金额' : '交易金额'}`}
                              onChange={(e) => setAmountDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  void saveCurrentValuePosition(e, fund, navPrice.value)
                                }
                                if (e.key === 'Escape') {
                                  setEditingCode('')
                                  setEditMode('set')
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
                                void saveCurrentValuePosition(e, fund, navPrice.value)
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
                              <span
                                className={classNames(
                                  styles.positionValue,
                                  holdingAmount == null && styles.emptyPositionValue
                                )}
                                title={
                                  shares != null && costPrice != null
                                    ? `${formatValue(shares, 2)} 份 × ¥${formatValue(costPrice, 4)}${totalPositionProfit != null ? `，总盈亏 ${totalPositionProfit > 0 ? '+' : ''}${formatMoney(totalPositionProfit)}` : ''}`
                                    : '尚未设置当前持有'
                                }
                              >
                                <span>
                                  {holdingAmount != null ? `¥${formatMoney(holdingAmount)}` : '¥0'}
                                </span>
                                {positionMeta && <em>{positionMeta}</em>}
                              </span>
                              <button
                                type="button"
                                className={styles.iconBtn}
                                title={shares != null ? '更新持有金额' : '设置持有金额'}
                                onClick={(e) => startEdit(e, fund.code, holdingAmount)}
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
                      <td className={classNames('num muted', styles.updateCell)}>
                        {(currentChange.time || '').slice(-5) || '—'}
                      </td>
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
