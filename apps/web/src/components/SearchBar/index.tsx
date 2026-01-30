import React, { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import styles from './index.module.scss'

export interface SearchResult {
  id: string
  name: string
  type: 'steam-game' | 'mini-game'
  status?: 'playing' | 'queueing' | 'completion'
  mainTab: 'steamgames' | 'playground'
}

interface SearchBarProps {
  onSearch: (term: string) => void
  value: string
  results?: SearchResult[]
  onResultClick?: (result: SearchResult) => void
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  value,
  results = [],
  onResultClick,
}) => {
  const [showResults, setShowResults] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (term: string) => {
    onSearch(term)
    setShowResults(term.length > 0)
  }

  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result)
    setShowResults(false)
    onSearch('')
  }

  return (
    <div className={styles.searchContainer} ref={containerRef}>
      <Search className={styles.searchIcon} size={18} />
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Search games..."
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => value && setShowResults(true)}
      />
      {showResults && results.length > 0 && (
        <div className={styles.searchResults}>
          {results.map((result) => (
            <div
              key={result.id}
              className={styles.searchResultItem}
              onClick={() => handleResultClick(result)}
            >
              <div className={styles.resultName}>{result.name}</div>
              <div className={styles.resultMeta}>
                {result.type === 'steam-game' ? (
                  <>
                    <span className={styles.badge}>Steam</span>
                    {result.status && (
                      <span className={`${styles.statusBadge} ${styles[result.status]}`}>
                        {result.status === 'playing'
                          ? 'Playing'
                          : result.status === 'queueing'
                            ? 'Queueing'
                            : 'Completion'}
                      </span>
                    )}
                  </>
                ) : (
                  <span className={styles.badge}>Playground</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
