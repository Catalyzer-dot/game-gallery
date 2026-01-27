import React, { useState, useEffect, useCallback, useRef } from 'react'
import styles from './Breakout.module.scss'

// 游戏常量
const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 500
const PADDLE_WIDTH = 100
const PADDLE_HEIGHT = 12
const BALL_RADIUS = 7
const BRICK_ROWS = 6
const BRICK_COLS = 10
const BRICK_PADDING = 4
const BRICK_WIDTH = (CANVAS_WIDTH - BRICK_PADDING * (BRICK_COLS + 1)) / BRICK_COLS
const BRICK_HEIGHT = 18
const BRICK_OFFSET_TOP = 50
const BRICK_OFFSET_LEFT = BRICK_PADDING

interface Brick {
  x: number
  y: number
  status: number // 1: active, 0: destroyed
  color: string
  score: number
}

interface Ball {
  x: number
  y: number
  dx: number
  dy: number
}

interface Level {
  name: string
  brickPattern: number[][] // 砖块的耐久度
  ballSpeed: number
}

const LEVELS: Level[] = [
  {
    name: '第一关：入门',
    brickPattern: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    ],
    ballSpeed: 3,
  },
  {
    name: '第二关：进阶',
    brickPattern: [
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    ],
    ballSpeed: 4,
  },
  {
    name: '第三关：挑战',
    brickPattern: [
      [3, 0, 3, 0, 3, 3, 0, 3, 0, 3],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [3, 0, 3, 0, 3, 3, 0, 3, 0, 3],
    ],
    ballSpeed: 5,
  },
]

const BRICK_COLORS = {
  1: { color: '#22c55e', score: 10 },
  2: { color: '#f59e0b', score: 20 },
  3: { color: '#ef4444', score: 30 },
}

export const Breakout: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentLevel, setCurrentLevel] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameStatus, setGameStatus] = useState<'ready' | 'playing' | 'paused' | 'won' | 'lost'>(
    'ready'
  )
  const [bricks, setBricks] = useState<Brick[]>([])

  const paddleXRef = useRef((CANVAS_WIDTH - PADDLE_WIDTH) / 2)
  const ballRef = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 10,
    dx: 0,
    dy: 0,
  })
  const animationFrameRef = useRef<number | undefined>(undefined)
  const rightPressedRef = useRef(false)
  const leftPressedRef = useRef(false)

  const level = LEVELS[currentLevel]

  // 初始化砖块
  const initBricks = useCallback(() => {
    const newBricks: Brick[] = []
    const pattern = level.brickPattern

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        const type = pattern[row][col]
        if (type > 0) {
          const brick: Brick = {
            x: BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING),
            y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING),
            status: 1,
            color: BRICK_COLORS[type as keyof typeof BRICK_COLORS].color,
            score: BRICK_COLORS[type as keyof typeof BRICK_COLORS].score,
          }
          newBricks.push(brick)
        }
      }
    }

    setBricks(newBricks)
  }, [level])

  // 重置球和挡板
  const resetBallAndPaddle = useCallback(() => {
    paddleXRef.current = (CANVAS_WIDTH - PADDLE_WIDTH) / 2
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 10,
      dx: 0,
      dy: 0,
    }
  }, [])

  // 开始游戏
  const startGame = useCallback(() => {
    const angle = (Math.random() * 60 - 30) * (Math.PI / 180) // -30 to 30 degrees
    ballRef.current.dx = level.ballSpeed * Math.sin(angle)
    ballRef.current.dy = -level.ballSpeed * Math.cos(angle)
    setGameStatus('playing')
  }, [level])

  // 初始化关卡
  useEffect(() => {
    initBricks()
    resetBallAndPaddle()
  }, [currentLevel, initBricks, resetBallAndPaddle])

  // 碰撞检测
  const collisionDetection = useCallback(() => {
    const ball = ballRef.current
    let hitBrickIndex = -1
    let hitFromSide = false

    // 先找到碰撞的砖块
    for (let i = 0; i < bricks.length; i++) {
      const brick = bricks[i]
      if (brick.status === 0) continue

      // 检测球是否与砖块碰撞（考虑球的半径）
      if (
        ball.x + BALL_RADIUS > brick.x &&
        ball.x - BALL_RADIUS < brick.x + BRICK_WIDTH &&
        ball.y + BALL_RADIUS > brick.y &&
        ball.y - BALL_RADIUS < brick.y + BRICK_HEIGHT
      ) {
        // 判断碰撞方向
        const ballCenterX = ball.x
        const ballCenterY = ball.y
        const brickCenterX = brick.x + BRICK_WIDTH / 2
        const brickCenterY = brick.y + BRICK_HEIGHT / 2

        const diffX = Math.abs(ballCenterX - brickCenterX)
        const diffY = Math.abs(ballCenterY - brickCenterY)

        // 根据碰撞角度决定反弹方向
        hitFromSide = diffX / BRICK_WIDTH > diffY / BRICK_HEIGHT
        hitBrickIndex = i
        break
      }
    }

    // 如果检测到碰撞，处理反弹和销毁
    if (hitBrickIndex >= 0) {
      const brick = bricks[hitBrickIndex]

      // 反转球的速度
      if (hitFromSide) {
        ball.dx = -ball.dx
      } else {
        ball.dy = -ball.dy
      }

      // 更新砖块状态
      setBricks((prevBricks) => {
        const newBricks = prevBricks.map((b, index) => {
          if (index === hitBrickIndex) {
            return { ...b, status: 0 }
          }
          return b
        })

        // 检查是否所有砖块都被摧毁
        const allDestroyed = newBricks.every((brick) => brick.status === 0)
        if (allDestroyed) {
          setTimeout(() => setGameStatus('won'), 100)
        }

        return newBricks
      })

      // 增加分数
      setScore((prev) => prev + brick.score)
    }
  }, [bricks])

  // 绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 绘制砖块 - 极简风格
    bricks.forEach((brick) => {
      if (brick.status === 1) {
        ctx.fillStyle = brick.color
        ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT)
      }
    })

    // 绘制挡板 - 极简风格
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(paddleXRef.current, CANVAS_HEIGHT - PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT)

    // 绘制球 - 极简风格
    ctx.beginPath()
    ctx.arc(ballRef.current.x, ballRef.current.y, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.closePath()
  }, [bricks])

  // 游戏主循环
  useEffect(() => {
    if (gameStatus !== 'playing') {
      draw()
      return
    }

    const gameLoop = () => {
      const ball = ballRef.current

      // 移动挡板
      if (rightPressedRef.current && paddleXRef.current < CANVAS_WIDTH - PADDLE_WIDTH) {
        paddleXRef.current += 7
      }
      if (leftPressedRef.current && paddleXRef.current > 0) {
        paddleXRef.current -= 7
      }

      // 墙壁碰撞 - 左右边界
      if (ball.x + ball.dx > CANVAS_WIDTH - BALL_RADIUS || ball.x + ball.dx < BALL_RADIUS) {
        ball.dx = -ball.dx
      }

      // 墙壁碰撞 - 上边界
      if (ball.y + ball.dy < BALL_RADIUS) {
        ball.dy = -ball.dy
      }

      // 移动球
      ball.x += ball.dx
      ball.y += ball.dy

      // 挡板碰撞检测
      if (
        ball.y + BALL_RADIUS >= CANVAS_HEIGHT - PADDLE_HEIGHT &&
        ball.y + BALL_RADIUS <= CANVAS_HEIGHT &&
        ball.x >= paddleXRef.current &&
        ball.x <= paddleXRef.current + PADDLE_WIDTH &&
        ball.dy > 0
      ) {
        // 根据球击中挡板的位置改变反弹角度
        const hitPos = (ball.x - paddleXRef.current) / PADDLE_WIDTH // 0 to 1
        const angle = (hitPos - 0.5) * 120 * (Math.PI / 180) // -60 to 60 degrees
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)
        ball.dx = speed * Math.sin(angle)
        ball.dy = -Math.abs(speed * Math.cos(angle)) // 确保向上
      }

      // 球掉落检测
      if (ball.y > CANVAS_HEIGHT + BALL_RADIUS) {
        setLives((prev) => {
          const newLives = prev - 1
          if (newLives <= 0) {
            setGameStatus('lost')
          } else {
            setGameStatus('ready')
            resetBallAndPaddle()
          }
          return newLives
        })
        return
      }

      collisionDetection()
      draw()

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameStatus, draw, collisionDetection, resetBallAndPaddle])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        rightPressedRef.current = true
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        leftPressedRef.current = true
      } else if (e.key === ' ' && gameStatus === 'ready') {
        e.preventDefault()
        startGame()
      } else if (e.key === 'p' || e.key === 'P') {
        if (gameStatus === 'playing') {
          setGameStatus('paused')
        } else if (gameStatus === 'paused') {
          setGameStatus('playing')
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        rightPressedRef.current = false
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        leftPressedRef.current = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameStatus, startGame])

  // 鼠标控制
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left

    if (mouseX > PADDLE_WIDTH / 2 && mouseX < CANVAS_WIDTH - PADDLE_WIDTH / 2) {
      paddleXRef.current = mouseX - PADDLE_WIDTH / 2
    }
  }

  // 下一关
  const nextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel((prev) => prev + 1)
      setGameStatus('ready')
    }
  }

  // 重置游戏
  const restartGame = () => {
    setScore(0)
    setLives(3)
    setCurrentLevel(0)
    setGameStatus('ready')
    resetBallAndPaddle()
    initBricks()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.gameContainer}>
        <div className={styles.header}>
          <h2>打砖块：{level.name}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div className={styles.statsBar}>
          <div className={styles.stat}>得分: {score}</div>
          <div className={styles.stat}>生命: {lives}</div>
          <div className={styles.stat}>
            关卡: {currentLevel + 1}/{LEVELS.length}
          </div>
        </div>

        <div className={styles.gameBoard}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className={styles.canvas}
            onMouseMove={handleMouseMove}
          />

          {gameStatus === 'ready' && (
            <div className={styles.messageOverlay}>
              <div className={styles.message}>
                <h3>准备开始</h3>
                <p>按空格键开始</p>
                <p className={styles.hint}>方向键或 A/D 移动挡板</p>
                <p className={styles.hint}>P 暂停游戏</p>
              </div>
            </div>
          )}

          {gameStatus === 'paused' && (
            <div className={styles.messageOverlay}>
              <div className={styles.message}>
                <h3>游戏暂停</h3>
                <p>按 P 键继续</p>
              </div>
            </div>
          )}

          {gameStatus === 'won' && (
            <div className={styles.messageOverlay}>
              <div className={styles.message}>
                <h3>关卡完成！</h3>
                <p>得分: {score}</p>
                {currentLevel < LEVELS.length - 1 ? (
                  <button onClick={nextLevel} className={styles.btn}>
                    下一关
                  </button>
                ) : (
                  <>
                    <p className={styles.congrats}>恭喜通关所有关卡</p>
                    <button onClick={restartGame} className={styles.btn}>
                      重新挑战
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {gameStatus === 'lost' && (
            <div className={styles.messageOverlay}>
              <div className={styles.message}>
                <h3>游戏结束</h3>
                <p>最终得分: {score}</p>
                <button onClick={restartGame} className={styles.btn}>
                  重新开始
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.instructions}>
          <p>使用方向键或鼠标移动挡板</p>
          <p>打碎所有砖块通关</p>
          <p>P 键暂停游戏</p>
        </div>
      </div>
    </div>
  )
}
