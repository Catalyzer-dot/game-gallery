import { useState, useEffect, useCallback } from 'react'

function getColumnCount(width: number): number {
  if (width >= 1800) return 6
  if (width >= 1400) return 5
  if (width >= 1024) return 4
  if (width >= 640) return 3
  return 2
}

function useMasonry() {
  const [columns, setColumns] = useState(() => getColumnCount(window.innerWidth))

  useEffect(() => {
    let rafId: number

    const handleResize = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        setColumns(getColumnCount(window.innerWidth))
      })
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const distribute = useCallback(
    <T>(items: T[]): T[][] => {
      const result: T[][] = Array.from({ length: columns }, () => [])

      items.forEach((item, index) => {
        result[index % columns].push(item)
      })

      return result
    },
    [columns]
  )

  return { columns, distribute }
}

export { useMasonry }
