/**
 * fund-tracker 数据访问层
 *
 * 全部走后端 degenerates-backend 的 /api/fund/* 接口。
 * 本文件不再直接调天天基金 / 新浪财经（CORS + GBK 由后端处理）。
 */
import type {
  DailyData,
  DailyRow,
  FundDailyRankRow,
  FundMeta,
  FundRankRow,
  FundIndexItem,
  GzData,
  HoldingsData,
  IndustryEtfsMap,
  IntradayData,
  QuoteRow,
  SearchHit,
  WatchFund,
} from '@/types'

const DEFAULT_API_BASE = import.meta.env.DEV ? 'https://degenerates.site' : ''
const API_BASE = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE).replace(/\/$/, '')
const TOKEN_KEY = 'session_token'

const url = (path: string): string => `${API_BASE}${path}`

interface BackendError {
  error?: string
  message?: string
}

export class ApiError extends Error {
  status: number

  constructor(status: number, statusText: string, detail = '') {
    super(`${status} ${statusText}${detail ? ': ' + detail : ''}`)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getSessionToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY)
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}

function authHeaders(headers?: HeadersInit): Headers {
  const next = new Headers(headers)
  if (!next.has('Accept')) next.set('Accept', 'application/json')

  const token = getSessionToken()
  if (token && !next.has('Authorization')) {
    next.set('Authorization', `Bearer ${token}`)
  }
  return next
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url(path), {
    cache: 'no-cache',
    ...init,
    headers: authHeaders(init?.headers),
  })
  if (!res.ok) {
    let detail = ''
    try {
      const body = (await res.json()) as BackendError
      detail = body.message || body.error || ''
    } catch {
      // ignore
    }
    throw new ApiError(res.status, res.statusText, detail)
  }
  return (await res.json()) as T
}

// ---------- watchlist ----------

export const loadWatchlist = (): Promise<WatchFund[]> => request<WatchFund[]>('/api/fund/watchlist')

export const addWatchlist = (code: string, name?: string, industry?: string): Promise<WatchFund> =>
  request<WatchFund>('/api/fund/watchlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, name, industry }),
  })

export const updateWatchlistPosition = (
  code: string,
  payload: {
    holdingAmount?: number | null
    navPrice?: number | null
    holdingShares?: number | null
    holdingCostPrice?: number | null
  }
): Promise<WatchFund> =>
  request<WatchFund>(`/api/fund/watchlist/${code}/position`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      holding_amount: payload.holdingAmount,
      nav_price: payload.navPrice,
      holding_shares: payload.holdingShares,
      holding_cost_price: payload.holdingCostPrice,
    }),
  })

export const removeWatchlist = async (code: string): Promise<void> => {
  const res = await fetch(url(`/api/fund/watchlist/${code}`), {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok && res.status !== 204) {
    throw new ApiError(res.status, res.statusText)
  }
}

// ---------- search ----------

export const searchFunds = async (key: string): Promise<SearchHit[]> => {
  const trimmed = key.trim()
  if (!trimmed) return []
  return request<SearchHit[]>(`/api/fund/search?q=${encodeURIComponent(trimmed)}`)
}

export const loadTop30dFunds = (limit = 10): Promise<FundRankRow[]> =>
  request<FundRankRow[]>(`/api/fund/rank/30d?limit=${limit}`)

export const loadTopPreviousDayFunds = (limit = 10): Promise<FundDailyRankRow[]> =>
  request<FundDailyRankRow[]>(`/api/fund/rank/previous-day?limit=${limit}`)

/** 兼容旧 import：本地索引已迁到后端，前端不再 bundle */
export const loadFundsIndex = async (): Promise<FundIndexItem[]> => []

// ---------- industry ETFs ----------

export const loadIndustryEtfs = (): Promise<IndustryEtfsMap> =>
  request<IndustryEtfsMap>('/api/fund/industry-etfs')

// ---------- per-fund 数据 ----------

export const loadMeta = (code: string): Promise<FundMeta | null> =>
  request<FundMeta>(`/api/fund/${code}/meta`).catch(() => null)

interface IntradayBackendResp {
  code: string
  date: string
  dwjz_prev: number | null
  points: Array<{ ts: string; gsz: number; gszzl: number | null }>
}

export const loadIntraday = async (code: string): Promise<IntradayData | null> => {
  try {
    const data = await request<IntradayBackendResp>(`/api/fund/${code}/intraday`)
    return {
      date: data.date,
      dwjz_prev: data.dwjz_prev != null ? String(data.dwjz_prev) : '',
      points: (data.points || []).map((p) => ({
        ts: p.ts,
        gsz: String(p.gsz),
        gszzl: p.gszzl != null ? String(p.gszzl) : '',
      })),
    }
  } catch {
    return null
  }
}

export const loadHoldings = async (code: string): Promise<HoldingsData | null> => {
  try {
    interface BackendHoldings {
      code: string
      report_date: string | null
      rows: Array<{
        rank: number
        stock_code: string
        stock_name: string
        ratio: number
        secid: string
      }>
    }
    const data = await request<BackendHoldings>(`/api/fund/${code}/holdings`)
    return {
      report_date: data.report_date || '',
      rows: data.rows.map((r) => ({
        code: r.stock_code,
        name: r.stock_name,
        ratio: r.ratio,
        secid: r.secid,
      })),
    }
  } catch {
    return null
  }
}

export const loadDaily = async (code: string, days = 90): Promise<DailyData | null> => {
  try {
    interface BackendDailyRow {
      date: string
      dwjz: number
      jzzzl: number | null
    }
    const rows = await request<BackendDailyRow[]>(`/api/fund/${code}/daily?days=${days}`)
    const mapped: DailyRow[] = rows.map((r) => ({
      date: r.date,
      dwjz: String(r.dwjz),
      jzzzl: r.jzzzl != null ? String(r.jzzzl) : '',
    }))
    return { rows: mapped }
  } catch {
    return null
  }
}

// ---------- 实时估值（fundgz 代理）----------

interface BackendRealtimeResp {
  code: string
  name: string
  jzrq: string
  dwjz: string
  gsz: string
  gszzl: string
  gztime: string
}

export const fetchGz = async (code: string): Promise<GzData | null> => {
  try {
    const r = await request<BackendRealtimeResp>(`/api/fund/${code}/realtime`)
    return {
      fundcode: r.code,
      name: r.name,
      jzrq: r.jzrq,
      dwjz: r.dwjz,
      gsz: r.gsz,
      gszzl: r.gszzl,
      gztime: r.gztime,
    }
  } catch {
    return null
  }
}

// ---------- 个股 / ETF 实时行情 ----------

export const fetchQuotes = async (secids: string[]): Promise<QuoteRow[]> => {
  if (!secids.length) return []
  try {
    return await request<QuoteRow[]>(
      `/api/fund/quote?secids=${encodeURIComponent(secids.join(','))}`
    )
  } catch {
    return []
  }
}

// ---------- 全局元信息（已不需要从仓库读）----------

export const loadGlobalMeta = async (): Promise<{ last_update?: string } | null> => null
