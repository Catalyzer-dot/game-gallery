import React, { useState, useEffect, useCallback, useRef } from 'react'
import styles from './SnakeGame.module.scss'

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Position = { x: number; y: number }

const GRID_SIZE = 20
const CELL_SIZE = 20
const INITIAL_SPEED = 150

export const SnakeGame: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<Position>({ x: 15, y: 15 })
  const [direction, setDirection] = useState<Direction>('RIGHT')
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const directionRef = useRef(direction)
  const gameLoopRef = useRef<number | undefined>(undefined)

  // 生成随机食物位置
  const generateFood = useCallback((currentSnake: Position[]) => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
    } while (currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [])

  // 重置游戏
  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }]
    setSnake(initialSnake)
    setFood(generateFood(initialSnake))
    setDirection('RIGHT')
    directionRef.current = 'RIGHT'
    setGameOver(false)
    setScore(0)
    setIsPaused(false)
    setGameStarted(true)
  }, [generateFood])

  // 游戏循环
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0]
        let newHead: Position

        switch (directionRef.current) {
          case 'UP':
            newHead = { x: head.x, y: head.y - 1 }
            break
          case 'DOWN':
            newHead = { x: head.x, y: head.y + 1 }
            break
          case 'LEFT':
            newHead = { x: head.x - 1, y: head.y }
            break
          case 'RIGHT':
            newHead = { x: head.x + 1, y: head.y }
            break
        }

        // 检查撞墙
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true)
          return prevSnake
        }

        // 检查撞到自己
        if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true)
          return prevSnake
        }

        const newSnake = [newHead, ...prevSnake]

        // 检查是否吃到食物
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((prev) => prev + 10)
          setFood(generateFood(newSnake))
        } else {
          newSnake.pop()
        }

        return newSnake
      })
    }

    gameLoopRef.current = setInterval(moveSnake, INITIAL_SPEED)

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameStarted, gameOver, isPaused, food, generateFood])

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted && e.key === ' ') {
        e.preventDefault()
        resetGame()
        return
      }

      if (gameOver) return

      if (e.key === ' ') {
        e.preventDefault()
        setIsPaused((prev) => !prev)
        return
      }

      const newDirection: Direction | null =
        e.key === 'ArrowUp' && directionRef.current !== 'DOWN'
          ? 'UP'
          : e.key === 'ArrowDown' && directionRef.current !== 'UP'
            ? 'DOWN'
            : e.key === 'ArrowLeft' && directionRef.current !== 'RIGHT'
              ? 'LEFT'
              : e.key === 'ArrowRight' && directionRef.current !== 'LEFT'
                ? 'RIGHT'
                : null

      if (newDirection) {
        e.preventDefault()
        directionRef.current = newDirection
        setDirection(newDirection)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameStarted, gameOver, resetGame])

  return (
    <div className={styles.overlay}>
      <div className={styles.gameContainer}>
        <div className={styles.header}>
          <h2>贪吃蛇</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div className={styles.scoreBoard}>
          <div className={styles.score}>得分: {score}</div>
          {gameStarted && !gameOver && (
            <button onClick={() => setIsPaused(!isPaused)} className={styles.pauseBtn}>
              {isPaused ? '继续' : '暂停'}
            </button>
          )}
        </div>

        <div
          className={styles.grid}
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
          }}
        >
          {/* 蛇身 */}
          {snake.map((segment, index) => (
            <div
              key={index}
              className={`${styles.snakeSegment} ${index === 0 ? styles.head : ''}`}
              style={{
                left: segment.x * CELL_SIZE,
                top: segment.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            />
          ))}

          {/* 食物 */}
          <div
            className={styles.food}
            style={{
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
          />

          {/* 游戏状态覆盖层 */}
          {!gameStarted && (
            <div className={styles.overlay}>
              <div className={styles.message}>
                <h3>贪吃蛇</h3>
                <p>使用方向键控制蛇的移动</p>
                <p>按空格键开始游戏</p>
              </div>
            </div>
          )}

          {isPaused && (
            <div className={styles.overlay}>
              <div className={styles.message}>
                <h3>游戏暂停</h3>
                <p>按空格键继续</p>
              </div>
            </div>
          )}

          {gameOver && (
            <div className={styles.overlay}>
              <div className={styles.message}>
                <h3>游戏结束</h3>
                <p>最终得分: {score}</p>
                <button onClick={resetGame} className={styles.restartBtn}>
                  重新开始
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.controls}>
          <div className={styles.instructions}>
            <p>🎮 方向键: 控制方向</p>
            <p>⏸️ 空格键: 暂停/继续</p>
          </div>
        </div>
      </div>
    </div>
  )
}
