import React, { useState, useEffect, useCallback } from 'react'
import styles from './Match3.module.scss'

// 游戏常量
const GRID_ROWS = 8
const GRID_COLS = 10
const TILE_TYPES = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🍑', '🍉', '🍌', '🥝']
const TIME_LIMIT = 300 // 5分钟

interface Tile {
  id: string
  row: number
  col: number
  type: string
  matched: boolean
}

interface Position {
  row: number
  col: number
}

export const Match3: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tiles, setTiles] = useState<Tile[]>([])
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null)
  const [gameStatus, setGameStatus] = useState<'ready' | 'playing' | 'won' | 'lost'>('ready')
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [matchedCount, setMatchedCount] = useState(0)
  const [hintPath, setHintPath] = useState<Position[]>([])

  // 初始化游戏
  const initGame = useCallback(() => {
    const newTiles: Tile[] = []
    const types = [...TILE_TYPES]
    const totalTiles = GRID_ROWS * GRID_COLS
    const pairsNeeded = totalTiles / 2

    // 确保每种类型都有偶数个
    const tilePool: string[] = []
    for (let i = 0; i < pairsNeeded; i++) {
      const type = types[i % types.length]
      tilePool.push(type, type)
    }

    // 打乱顺序
    for (let i = tilePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[tilePool[i], tilePool[j]] = [tilePool[j], tilePool[i]]
    }

    // 创建方块
    let index = 0
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        newTiles.push({
          id: `${row}-${col}`,
          row,
          col,
          type: tilePool[index],
          matched: false,
        })
        index++
      }
    }

    setTiles(newTiles)
    setSelectedTile(null)
    setMatchedCount(0)
    setTimeLeft(TIME_LIMIT)
    setHintPath([])
  }, [])

  // 开始游戏
  const startGame = useCallback(() => {
    initGame()
    setGameStatus('playing')
  }, [initGame])

  // 检查两个方块之间的路径
  const findPath = useCallback(
    (start: Tile, end: Tile): Position[] | null => {
      if (start.type !== end.type) return null

      const visited = new Set<string>()
      const queue: { pos: Position; path: Position[]; turns: number }[] = []

      queue.push({ pos: { row: start.row, col: start.col }, path: [], turns: 0 })

      const directions = [
        { row: -1, col: 0 }, // 上
        { row: 1, col: 0 }, // 下
        { row: 0, col: -1 }, // 左
        { row: 0, col: 1 }, // 右
      ]

      while (queue.length > 0) {
        const current = queue.shift()!
        const { pos, path, turns } = current

        if (pos.row === end.row && pos.col === end.col) {
          return [...path, pos]
        }

        if (turns > 2) continue

        const key = `${pos.row},${pos.col}`
        if (visited.has(key)) continue
        visited.add(key)

        for (const dir of directions) {
          let newRow = pos.row + dir.row
          let newCol = pos.col + dir.col

          // 沿着当前方向一直前进
          while (newRow >= -1 && newRow <= GRID_ROWS && newCol >= -1 && newCol <= GRID_COLS) {
            // 检查是否在边界外（允许在边界外一格）
            const isOutside = newRow < 0 || newRow >= GRID_ROWS || newCol < 0 || newCol >= GRID_COLS

            if (!isOutside) {
              const tile = tiles.find((t) => t.row === newRow && t.col === newCol)
              if (tile && !tile.matched && tile.id !== start.id && tile.id !== end.id) {
                break // 遇到障碍物
              }
            }

            const newPos = { row: newRow, col: newCol }
            const newPath = [...path, pos]

            // 计算转弯次数
            let newTurns = turns
            if (path.length > 0) {
              const lastPos = path[path.length - 1]
              const lastDir = {
                row: pos.row - lastPos.row,
                col: pos.col - lastPos.col,
              }
              const currentDir = {
                row: newRow - pos.row,
                col: newCol - pos.col,
              }
              if (lastDir.row !== currentDir.row || lastDir.col !== currentDir.col) {
                newTurns++
              }
            }

            if (newRow === end.row && newCol === end.col) {
              return [...newPath, newPos]
            }

            queue.push({ pos: newPos, path: newPath, turns: newTurns })

            newRow += dir.row
            newCol += dir.col
          }
        }
      }

      return null
    },
    [tiles]
  )

  // 处理方块点击
  const handleTileClick = useCallback(
    (tile: Tile) => {
      if (gameStatus !== 'playing' || tile.matched) return

      if (!selectedTile) {
        setSelectedTile(tile)
        setHintPath([])
      } else if (selectedTile.id === tile.id) {
        setSelectedTile(null)
      } else {
        const path = findPath(selectedTile, tile)
        if (path) {
          // 找到路径，匹配成功
          setHintPath(path)
          setTimeout(() => {
            setTiles((prev) =>
              prev.map((t) =>
                t.id === selectedTile.id || t.id === tile.id ? { ...t, matched: true } : t
              )
            )
            setMatchedCount((prev) => prev + 2)
            setSelectedTile(null)
            setHintPath([])
          }, 300)
        } else {
          // 没有路径，重新选择
          setSelectedTile(tile)
        }
      }
    },
    [selectedTile, gameStatus, findPath]
  )

  // 提示功能
  const showHint = useCallback(() => {
    const unmatchedTiles = tiles.filter((t) => !t.matched)
    for (let i = 0; i < unmatchedTiles.length; i++) {
      for (let j = i + 1; j < unmatchedTiles.length; j++) {
        const path = findPath(unmatchedTiles[i], unmatchedTiles[j])
        if (path) {
          setSelectedTile(unmatchedTiles[i])
          setHintPath(path)
          setTimeout(() => {
            setSelectedTile(null)
            setHintPath([])
          }, 2000)
          return
        }
      }
    }
  }, [tiles, findPath])

  // 计时器
  useEffect(() => {
    if (gameStatus !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameStatus('lost')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStatus])

  // 检查胜利
  useEffect(() => {
    if (gameStatus === 'playing' && matchedCount === GRID_ROWS * GRID_COLS) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: derive won status from matchedCount
      setGameStatus('won')
    }
  }, [matchedCount, gameStatus])

  // 初始化
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: initialize game state on mount
    initGame()
  }, [initGame])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.gameContainer}>
        <div className={styles.header}>
          <h2>连连看</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div className={styles.statsBar}>
          <div className={styles.stat}>剩余: {GRID_ROWS * GRID_COLS - matchedCount} 对</div>
          <div className={styles.stat}>时间: {formatTime(timeLeft)}</div>
          {gameStatus === 'playing' && (
            <button onClick={showHint} className={styles.hintBtn}>
              💡 提示
            </button>
          )}
        </div>

        <div className={styles.gameBoard}>
          <div className={styles.grid}>
            {tiles.map((tile) => (
              <div
                key={tile.id}
                className={`${styles.tile} ${tile.matched ? styles.matched : ''} ${
                  selectedTile?.id === tile.id ? styles.selected : ''
                }`}
                onClick={() => handleTileClick(tile)}
              >
                {!tile.matched && <span className={styles.tileIcon}>{tile.type}</span>}
              </div>
            ))}
          </div>

          {/* 绘制连接路径 */}
          {hintPath.length > 1 && (
            <svg className={styles.pathSvg}>
              <polyline
                points={hintPath
                  .map((pos) => {
                    const x = (pos.col + 0.5) * 50
                    const y = (pos.row + 0.5) * 50
                    return `${x},${y}`
                  })
                  .join(' ')}
                stroke="#22c55e"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {gameStatus === 'ready' && (
            <div className={styles.messageOverlay}>
              <div className={styles.message}>
                <h3>准备开始</h3>
                <p>找到相同的图案并连接消除</p>
                <p className={styles.hint}>连线最多只能拐两个弯</p>
                <button onClick={startGame} className={styles.btn}>
                  开始游戏
                </button>
              </div>
            </div>
          )}

          {gameStatus === 'won' && (
            <div className={styles.messageOverlay}>
              <div className={styles.message}>
                <h3>恭喜通关</h3>
                <p>用时: {formatTime(TIME_LIMIT - timeLeft)}</p>
                <button onClick={startGame} className={styles.btn}>
                  再玩一次
                </button>
              </div>
            </div>
          )}

          {gameStatus === 'lost' && (
            <div className={styles.messageOverlay}>
              <div className={styles.message}>
                <h3>时间到</h3>
                <p>已消除: {matchedCount} 对</p>
                <button onClick={startGame} className={styles.btn}>
                  重新开始
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.instructions}>
          <p>点击两个相同的图案进行消除</p>
          <p>连线最多只能拐两个弯</p>
        </div>
      </div>
    </div>
  )
}
