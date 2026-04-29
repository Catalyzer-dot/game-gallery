/* 搜索区：调后端 /api/fund/search + /api/fund/realtime */
import { useRef, useState } from 'react'
import { addWatchlist, fetchGz, searchFunds } from '@services/api'
import type { GzData, SearchHit, WatchFund } from '@/types'
import { pct, pctClass } from '@/utils/format'
import shared from '@/styles/shared.module.scss'
import styles from './index.module.scss'

interface Props {
  watchlist: WatchFund[]
  onWatchlistChange?: () => void
}

interface ResultPreview {
  gz: GzData | null
  loading: boolean
}

export default function Search({ watchlist, onWatchlistChange }: Props) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchHit[]>([])
  const [previews, setPreviews] = useState<Record<string, ResultPreview>>({})
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [addingCode, setAddingCode] = useState<string | null>(null)
  const [addError, setAddError] = useState<Record<string, string>>({})
  const debounceRef = useRef<number | null>(null)
  const searchRequestRef = useRef(0)

  function onChange(value: string) {
    setQ(value)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)

    searchRequestRef.current += 1
    setResults([])
    setPreviews({})
    setAddError({})
    setSearchError('')

    if (!value.trim()) {
      setSearching(false)
      return
    }

    setSearching(true)
    const requestId = searchRequestRef.current
    debounceRef.current = window.setTimeout(() => {
      void doSearch(value.trim(), requestId)
    }, 250)
  }

  async function doSearch(key: string, requestId: number) {
    if (searchRequestRef.current !== requestId) return
    try {
      const list = await searchFunds(key)
      if (searchRequestRef.current !== requestId) return
      setResults(list)
      setSearchError('')
      void loadResultPreviews(list.slice(0, 8), requestId)
    } catch (e) {
      if (searchRequestRef.current !== requestId) return
      setResults([])
      setSearchError(e instanceof Error ? e.message : String(e))
    } finally {
      if (searchRequestRef.current === requestId) {
        setSearching(false)
      }
    }
  }

  async function loadResultPreviews(list: SearchHit[], requestId: number) {
    if (!list.length) return

    setPreviews((prev) => {
      const next = { ...prev }
      list.forEach((hit) => {
        next[hit.code] = { gz: null, loading: true }
      })
      return next
    })

    for (const hit of list) {
      if (searchRequestRef.current !== requestId) return
      const gz = await fetchGz(hit.code)
      if (searchRequestRef.current !== requestId) return
      setPreviews((prev) => ({
        ...prev,
        [hit.code]: { gz, loading: false },
      }))
    }
  }

  async function handleAdd(hit: SearchHit) {
    if (addingCode) return
    setAddingCode(hit.code)
    setAddError((prev) => ({ ...prev, [hit.code]: '' }))
    try {
      await addWatchlist(hit.code, hit.name)
      onWatchlistChange?.()
    } catch (e) {
      setAddError((prev) => ({
        ...prev,
        [hit.code]: e instanceof Error ? e.message : String(e),
      }))
    } finally {
      setAddingCode(null)
    }
  }

  function isTracked(code: string) {
    return watchlist.some((w) => w.code === code)
  }

  return (
    <section className={shared.card}>
      <div className={shared.cardHead}>
        <h2>搜索基金</h2>
      </div>
      <div className={styles.box}>
        <input
          type="search"
          value={q}
          onChange={(e) => onChange(e.target.value)}
          placeholder="输入基金代码或名称（中/拼音首字母均可）"
          autoComplete="off"
          className={styles.input}
          aria-label="搜索基金"
        />
        {q.trim() && (
          <ul className={styles.results}>
            {searchError ? (
              <li className={styles.statusItem}>搜索失败：{searchError}</li>
            ) : searching ? (
              <li className={styles.statusItem}>搜索中…</li>
            ) : !results.length ? (
              <li className={styles.statusItem}>无结果</li>
            ) : (
              results.map((r) => {
                const preview = previews[r.code]
                const tracked = isTracked(r.code)
                return (
                  <li key={r.code} className={styles.resultItem}>
                    <a className={styles.resultMain} href={`#/fund/${r.code}`}>
                      <span className={styles.resultTitle}>
                        <span className={styles.code}>{r.code}</span>
                        <span className={styles.name}>{r.name}</span>
                      </span>
                      <span className={styles.resultMeta}>
                        {preview?.loading ? (
                          '估值加载中…'
                        ) : preview?.gz ? (
                          <>
                            <span>估值 {preview.gz.gsz || '—'}</span>
                            <span className={pctClass(preview.gz.gszzl)}>
                              {pct(preview.gz.gszzl)}
                            </span>
                            <span>{preview.gz.gztime.slice(-5) || '—'}</span>
                          </>
                        ) : (
                          '暂无实时估值'
                        )}
                      </span>
                      {addError[r.code] && (
                        <span className={styles.errorText}>添加失败：{addError[r.code]}</span>
                      )}
                    </a>
                    <span className={styles.type}>{r.ftype || r.type || ''}</span>
                    <button
                      type="button"
                      className={styles.addBtn}
                      onClick={() => void handleAdd(r)}
                      disabled={tracked || addingCode === r.code}
                    >
                      {tracked ? '已跟踪' : addingCode === r.code ? '添加中…' : '加入'}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        )}
      </div>
    </section>
  )
}
