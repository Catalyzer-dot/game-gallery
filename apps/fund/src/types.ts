/* fund-tracker 共用类型 */

export interface WatchFund {
  code: string
  name: string
  industry: string
  added: string
  holding_units?: number | null
  holding_updated_at?: string | null
}

export interface IndustryEtf {
  code: string
  name: string
  secid: string
}

export type IndustryEtfsMap = Record<string, IndustryEtf[]>

export interface FundIndexItem {
  code: string
  name: string
  type: string
  jp: string
}

/** fundgz 实时估值 */
export interface GzData {
  fundcode: string
  name: string
  jzrq: string // 上日净值日期
  dwjz: string // 上日净值
  gsz: string // 当前估值
  gszzl: string // 估算涨跌 %
  gztime: string // 估值时间 yyyy-MM-dd HH:mm
}

/** 搜索结果（后端返回 ftype，旧前端代码用 type） */
export interface SearchHit {
  code: string
  name: string
  ftype?: string
  type?: string
}

export interface FundRankRow {
  code: string
  name: string
  ftype?: string | null
  latest_date: string
  base_date?: string | null
  latest_nav?: number | null
  base_nav?: number | null
  return_pct: number
  updated_at: string
}

export interface FundDailyRankRow {
  code: string
  name: string
  ftype?: string | null
  date: string
  nav?: number | null
  return_pct: number
  updated_at: string
}

/** 持仓股 */
export interface HoldingRow {
  code: string
  name: string
  ratio: number
  secid: string
}

export interface HoldingsData {
  report_date: string
  rows: HoldingRow[]
}

/** 日内估值快照 */
export interface IntradayPoint {
  ts: string
  gsz: string
  gszzl: string
}

export interface IntradayData {
  date: string
  dwjz_prev: string
  points: IntradayPoint[]
  updated?: string
}

/** 历史净值 */
export interface DailyRow {
  date: string
  dwjz: string
  jzzzl: string
}

export interface DailyData {
  rows: DailyRow[]
}

/** 基金元信息 */
export interface FundMeta {
  name: string
  manager: string
  scale: string
  scale_date: string
  type?: string
  r_1m: string
  r_6m: string
  r_1y: string
}

/** 后端 /api/quote 返回 */
export interface QuoteRow {
  secid: string
  name: string
  price: number | null
  prev: number | null
  chg: number | null
}

export interface GlobalMeta {
  last_update?: string
  last_mode?: string
}
