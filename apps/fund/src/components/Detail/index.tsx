import { useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'
import {
  fetchGz,
  fetchQuotes,
  loadDaily,
  loadHoldings,
  loadIntraday,
  loadMeta,
  loadWatchlist,
} from '@services/api'
import Sparkline from '@components/Sparkline'
import type {
  DailyData,
  FundMeta,
  HoldingsData,
  IntradayData,
  IntradayPoint,
  QuoteRow,
} from '@/types'
import { isTradeMinute, num, pct, pctClass } from '@/utils/format'
import shared from '@/styles/shared.module.scss'
import styles from './index.module.scss'

interface Props {
  code: string
}

function sortDailyRowsDesc(rows: DailyData['rows'] | undefined): DailyData['rows'] {
  return [...(rows || [])].sort((a, b) => b.date.localeCompare(a.date))
}

function toNumber(value: string | null | undefined): number | null {
  if (!value) return null
  const numValue = Number(value)
  return Number.isFinite(numValue) ? numValue : null
}

function deriveDailyChange(latestValue: string, previousValue: string, fallback: string): string {
  if (fallback) {
    return fallback
  }

  const latest = toNumber(latestValue)
  const previous = toNumber(previousValue)
  if (latest == null || previous == null || previous === 0) {
    return ''
  }

  return (((latest - previous) / previous) * 100).toFixed(2)
}

function mergeDailyRows(current: DailyData | null, incoming: DailyData | null): DailyData | null {
  if (!incoming?.rows.length) {
    return current
  }

  const rowsByDate = new Map<string, DailyData['rows'][number]>()
  ;(current?.rows || []).forEach((row) => rowsByDate.set(row.date, row))
  incoming.rows.forEach((row) => rowsByDate.set(row.date, row))

  return {
    rows: sortDailyRowsDesc(Array.from(rowsByDate.values())),
  }
}

export default function Detail({ code }: Props) {
  const [meta, setMeta] = useState<FundMeta | null>(null)
  const [intraday, setIntraday] = useState<IntradayData | null>(null)
  const [holdings, setHoldings] = useState<HoldingsData | null>(null)
  const [holdingQuotes, setHoldingQuotes] = useState<QuoteRow[]>([])
  const [daily, setDaily] = useState<DailyData | null>(null)
  const [fundName, setFundName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [quoteRefreshing, setQuoteRefreshing] = useState(false)

  const intradayRef = useRef<IntradayData | null>(null)
  const holdingsRef = useRef<HoldingsData | null>(null)
  const loadRequestRef = useRef(0)

  useEffect(() => {
    intradayRef.current = intraday
  }, [intraday])

  useEffect(() => {
    holdingsRef.current = holdings
  }, [holdings])

  useEffect(() => {
    void initialLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  useEffect(() => {
    const id = window.setInterval(() => {
      const tradeMinute = isTradeMinute()
      if (tradeMinute) {
        void refreshIntradayPoint()
        void refreshHoldingQuotes()
      }
      void refreshLatestDaily()
    }, 30000)

    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  async function initialLoad() {
    const requestId = loadRequestRef.current + 1
    loadRequestRef.current = requestId

    setLoading(true)
    setLoadError('')
    setFundName(code)
    setMeta(null)
    setIntraday(null)
    setHoldings(null)
    setHoldingQuotes([])
    setDaily(null)

    try {
      const [metaData, intradayData, holdingsData, dailyData, watchlist] = await Promise.all([
        loadMeta(code),
        loadIntraday(code),
        loadHoldings(code),
        loadDaily(code),
        loadWatchlist(),
      ])
      if (loadRequestRef.current !== requestId) return

      setMeta(metaData)
      setIntraday(intradayData)
      setHoldings(holdingsData)
      setDaily(dailyData)

      const watch = (watchlist || []).find((item) => item.code === code)
      setFundName(watch?.name || metaData?.name || code)

      const holdingSecids = holdingsData?.rows.map((row) => row.secid).filter(Boolean) || []
      const nextHoldingQuotes = holdingSecids.length ? await fetchQuotes(holdingSecids) : []
      if (loadRequestRef.current !== requestId) return
      setHoldingQuotes(nextHoldingQuotes)

      if (!metaData && !intradayData && !holdingsData && !dailyData) {
        setLoadError('Fund data is temporarily unavailable. Please try again later.')
      }
    } catch (error) {
      if (loadRequestRef.current !== requestId) return
      setLoadError(error instanceof Error ? error.message : String(error))
    } finally {
      if (loadRequestRef.current === requestId) {
        setLoading(false)
      }
    }
  }

  async function refreshIntradayPoint() {
    const gz = await fetchGz(code)
    if (!gz?.gszzl) return

    const current = intradayRef.current
    if (!current) return

    const ts = gz.gztime.slice(-5)
    const points: IntradayPoint[] = [...current.points]
    if (points.length && points[points.length - 1].ts === ts) {
      points[points.length - 1] = { ts, gsz: gz.gsz, gszzl: gz.gszzl }
    } else {
      points.push({ ts, gsz: gz.gsz, gszzl: gz.gszzl })
    }

    setIntraday({ ...current, points, updated: gz.gztime })
  }

  async function refreshLatestDaily() {
    const latestDaily = await loadDaily(code, 2)
    if (!latestDaily?.rows.length) return
    setDaily((prev) => mergeDailyRows(prev, latestDaily))
  }

  async function refreshHoldingQuotes() {
    const currentHoldings = holdingsRef.current
    if (!currentHoldings?.rows.length) return

    const secids = currentHoldings.rows.map((row) => row.secid).filter(Boolean)
    if (!secids.length) return

    setHoldingQuotes(await fetchQuotes(secids))
  }

  async function manualRefreshQuotes() {
    setQuoteRefreshing(true)
    try {
      await refreshHoldingQuotes()
      await refreshLatestDaily()
    } finally {
      setQuoteRefreshing(false)
    }
  }

  const intradayValues = useMemo(
    () => (intraday?.points || []).map((point) => Number(point.gszzl) || 0),
    [intraday]
  )
  const intradayLast = intraday?.points.at(-1)

  const latestDailyRows = useMemo(() => sortDailyRowsDesc(daily?.rows), [daily])
  const latestDaily = latestDailyRows[0]
  const previousDaily = latestDailyRows[1]
  const latestDailyChange = useMemo(
    () =>
      deriveDailyChange(
        latestDaily?.dwjz || '',
        previousDaily?.dwjz || '',
        latestDaily?.jzzzl || ''
      ),
    [latestDaily, previousDaily]
  )

  const displaySnapshot = latestDaily?.dwjz
    ? {
        title: `最新净值（${latestDaily.date}）`,
        label: '净值',
        value: latestDaily.dwjz,
        change: latestDailyChange,
      }
    : intradayLast
      ? {
          title: `日内估值（${intraday?.date || '-'}）`,
          label: '估值',
          value: intradayLast.gsz,
          change: intradayLast.gszzl,
        }
      : null

  const dailyValues = useMemo(
    () =>
      [...latestDailyRows]
        .reverse()
        .map((row) => Number(row.dwjz))
        .filter(Number.isFinite),
    [latestDailyRows]
  )
  const dailyReturn = useMemo(() => {
    if (dailyValues.length < 2) return null
    const first = dailyValues[0]
    const last = dailyValues[dailyValues.length - 1]
    if (!first) return null
    return ((last - first) / first) * 100
  }, [dailyValues])

  const holdingsBySecid = useMemo(() => {
    const map = new Map<string, QuoteRow>()
    holdingQuotes.forEach((quote) => map.set(quote.secid, quote))
    return map
  }, [holdingQuotes])

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1>
          <a className={shared.back} href="#">
            返回
          </a>
          <span>{fundName}</span>
        </h1>
        <div className={shared.meta}>
          <span className="muted">{code}</span>
          <a
            href={`https://fund.eastmoney.com/${code}.html`}
            target="_blank"
            rel="noopener noreferrer"
          >
            天天基金
          </a>
        </div>
      </header>

      <main className={shared.main}>
        {loading && <div className={shared.statusBox}>加载基金数据中...</div>}
        {loadError && <div className={shared.errorBox}>{loadError}</div>}

        <section className={shared.card}>
          <div className={styles.metaGrid}>
            <div>
              <label>类型</label>
              <span>{meta?.type || '-'}</span>
            </div>
            <div>
              <label>规模</label>
              <span>
                {meta?.scale ? `${meta.scale} 亿` : '-'}
                {meta?.scale_date && <span className="muted small"> ({meta.scale_date})</span>}
              </span>
            </div>
            <div>
              <label>经理</label>
              <span>{meta?.manager || '-'}</span>
            </div>
            <div>
              <label>近 1 年</label>
              <span className={pctClass(meta?.r_1y)}>{meta?.r_1y ? `${meta.r_1y}%` : '-'}</span>
            </div>
          </div>
        </section>

        <section className={shared.card}>
          <div className={shared.cardHead}>
            <h2>{displaySnapshot?.title || '日内估值'}</h2>
            {displaySnapshot && (
              <span className={classNames('muted', pctClass(displaySnapshot.change))}>
                {displaySnapshot.label} {displaySnapshot.value} · {pct(displaySnapshot.change)}
              </span>
            )}
          </div>
          {intradayValues.length >= 2 ? (
            <Sparkline data={intradayValues} zeroLine height={120} />
          ) : (
            <div className={styles.empty}>暂无日内数据</div>
          )}
        </section>

        <section className={shared.card}>
          <div className={shared.cardHead}>
            <h2>
              十大持仓
              {holdings?.report_date && (
                <span className="muted small"> 截止 {holdings.report_date}</span>
              )}
            </h2>
            <button
              type="button"
              className={shared.ghostBtn}
              onClick={manualRefreshQuotes}
              disabled={quoteRefreshing}
            >
              {quoteRefreshing ? '刷新中...' : '刷新'}
            </button>
          </div>
          {!holdings?.rows.length ? (
            <div className={styles.empty}>暂无持仓数据</div>
          ) : (
            <div className={shared.tableScroll}>
              <table className={shared.dataTable}>
                <thead>
                  <tr>
                    <th>代码</th>
                    <th>名称</th>
                    <th className="num">占比</th>
                    <th className="num">现价</th>
                    <th className="num">涨跌</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.rows.map((row) => {
                    const quote = holdingsBySecid.get(row.secid)
                    return (
                      <tr key={row.code} className={styles.noHover}>
                        <td>{row.code}</td>
                        <td>{row.name}</td>
                        <td className="num">{row.ratio.toFixed(2)}%</td>
                        <td className="num">{num(quote?.price)}</td>
                        <td className={classNames('num', pctClass(quote?.chg))}>
                          {pct(quote?.chg)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={shared.card}>
          <div className={shared.cardHead}>
            <h2>近 90 天净值</h2>
            {daily?.rows.length && dailyReturn != null && (
              <span className="muted small">
                {daily.rows.length} 个交易日，累计{' '}
                <span className={pctClass(dailyReturn)}>
                  {dailyReturn >= 0 ? '+' : ''}
                  {dailyReturn.toFixed(2)}%
                </span>
              </span>
            )}
          </div>
          {dailyValues.length >= 2 ? (
            <Sparkline data={dailyValues} height={120} color="#3fb950" />
          ) : (
            <div className={styles.empty}>暂无历史净值数据</div>
          )}
        </section>
      </main>

      <footer className={shared.footer}>数据：公开行情，仅供参考，不构成投资建议。</footer>
    </div>
  )
}
