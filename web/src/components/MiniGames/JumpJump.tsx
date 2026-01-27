import React, { useState, useEffect, useCallback, useRef } from 'react'
import styles from './JumpJump.module.scss'

// 游戏常量
const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 600
const PLAYER_SIZE = 36
const PLATFORM_WIDTH = 80
const PLATFORM_HEIGHT = 16
const MAX_POWER = 250
const GRAVITY = 0.6
const CENTER_BONUS_ZONE = 18

interface Platform {
  x: number
  y: number
  width: number
}

interface Player {
  x: number
  y: number
  vx: number
  vy: number
  charging: boolean
  power: number
  onGround: boolean
}

export const JumpJump: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameStatus, setGameStatus] = useState<'ready' | 'playing' | 'over'>('ready')
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('jumpjump-best-score')
    return saved ? parseInt(saved) : 0
  })

  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2,
    y: 300,
    vx: 0,
    vy: 0,
    charging: false,
    power: 0,
    onGround: false,
  })

  const platformsRef = useRef<Platform[]>([])
  const currentPlatformRef = useRef(0)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const mouseDownRef = useRef(false)

  // 初始化平台
  const initPlatforms = useCallback(() => {
    const platforms: Platform[] = []
    platforms.push({
      x: CANVAS_WIDTH / 2 - PLATFORM_WIDTH / 2,
      y: 400,
      width: PLATFORM_WIDTH,
    })

    for (let i = 1; i < 10; i++) {
      const lastPlatform = platforms[i - 1]
      const distance = 100 + Math.random() * 100
      const angle = (Math.random() * 60 - 30) * (Math.PI / 180)

      platforms.push({
        x: lastPlatform.x + Math.cos(angle) * distance,
        y: lastPlatform.y - 80 - Math.random() * 40,
        width: 60 + Math.random() * 40,
      })
    }

    return platforms
  }, [])

  // 初始化游戏
  const initGame = useCallback(() => {
    const platforms = initPlatforms()
    platformsRef.current = platforms

    playerRef.current = {
      x: platforms[0].x + platforms[0].width / 2,
      y: platforms[0].y - PLAYER_SIZE,
      vx: 0,
      vy: 0,
      charging: false,
      power: 0,
      onGround: true,
    }

    currentPlatformRef.current = 0
    setScore(0)
    setCombo(0)
  }, [initPlatforms])

  // 开始游戏
  const startGame = useCallback(() => {
    initGame()
    setGameStatus('playing')
  }, [initGame])

  // 添加新平台
  const addNewPlatform = useCallback(() => {
    const lastPlatform = platformsRef.current[platformsRef.current.length - 1]
    const distance = 100 + Math.random() * 100
    const angle = (Math.random() * 60 - 30) * (Math.PI / 180)

    platformsRef.current.push({
      x: lastPlatform.x + Math.cos(angle) * distance,
      y: lastPlatform.y - 80 - Math.random() * 40,
      width: 60 + Math.random() * 40,
    })

    // 移除旧平台
    if (platformsRef.current.length > 10) {
      platformsRef.current.shift()
      currentPlatformRef.current--
    }
  }, [])

  // 绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 圆角矩形辅助函数
    const drawRoundRect = (x: number, y: number, width: number, height: number, radius: number) => {
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, width, height, radius)
      } else {
        // 降级方案：手动绘制圆角矩形
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + width - radius, y)
        ctx.arcTo(x + width, y, x + width, y + radius, radius)
        ctx.lineTo(x + width, y + height - radius)
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
        ctx.lineTo(x + radius, y + height)
        ctx.arcTo(x, y + height, x, y + height - radius, radius)
        ctx.lineTo(x, y + radius)
        ctx.arcTo(x, y, x + radius, y, radius)
      }
    }

    // 清空画布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 计算相机偏移（跟随玩家，保持玩家在屏幕中心）
    const cameraX = playerRef.current.x - CANVAS_WIDTH / 2
    const cameraY = playerRef.current.y - CANVAS_HEIGHT * 0.7

    // 绘制平台（圆角矩形）
    platformsRef.current.forEach((platform, index) => {
      const x = platform.x - cameraX
      const y = platform.y - cameraY

      if (x > -100 && x < CANVAS_WIDTH + 100 && y > -50 && y < CANVAS_HEIGHT + 50) {
        const radius = 8

        // 绘制中心区域（背景，圆角）
        const centerX = x + platform.width / 2
        ctx.fillStyle = 'rgba(34, 197, 94, 0.15)'
        ctx.beginPath()
        drawRoundRect(
          centerX - CENTER_BONUS_ZONE,
          y,
          CENTER_BONUS_ZONE * 2,
          PLATFORM_HEIGHT,
          radius
        )
        ctx.fill()

        // 当前平台样式
        if (index === currentPlatformRef.current) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
        }

        // 绘制圆角矩形平台
        ctx.beginPath()
        drawRoundRect(x, y, platform.width, PLATFORM_HEIGHT, radius)
        ctx.fill()
      }
    })

    // 绘制玩家
    const playerX = playerRef.current.x - cameraX
    const playerY = playerRef.current.y - cameraY
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(playerX, playerY, PLAYER_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.closePath()

    // 绘制蓄力条
    if (playerRef.current.charging) {
      const barWidth = 50
      const barHeight = 4
      const barX = playerX - barWidth / 2
      const barY = playerY - PLAYER_SIZE - 10

      // 背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.fillRect(barX, barY, barWidth, barHeight)

      // 蓄力进度
      const powerRatio = playerRef.current.power / MAX_POWER
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(barX, barY, barWidth * powerRatio, barHeight)
    }

    // 绘制连击数（极简）
    if (combo > 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.font = '600 20px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${combo}x`, CANVAS_WIDTH / 2, 40)
    }
  }, [combo])

  // 检查落点
  const checkLanding = useCallback(() => {
    const player = playerRef.current

    // 只在下落时检测
    if (player.vy <= 0) return false

    for (let i = currentPlatformRef.current; i < platformsRef.current.length; i++) {
      const platform = platformsRef.current[i]

      // 检查水平范围（考虑球的半径）
      const playerLeft = player.x - PLAYER_SIZE / 2
      const playerRight = player.x + PLAYER_SIZE / 2
      const platformLeft = platform.x
      const platformRight = platform.x + platform.width

      // 检查是否有水平重叠
      if (playerRight > platformLeft && playerLeft < platformRight) {
        // 检查垂直位置（球的底部与平台顶部）
        const playerBottom = player.y + PLAYER_SIZE / 2
        const platformTop = platform.y

        // 如果球底部刚好在平台顶部附近
        if (playerBottom >= platformTop && playerBottom <= platformTop + PLATFORM_HEIGHT + 5) {
          // 成功落在平台上
          player.y = platformTop - PLAYER_SIZE / 2
          player.vx = 0
          player.vy = 0
          player.onGround = true

          // 检查是否落在中心
          const centerX = platform.x + platform.width / 2
          const distance = Math.abs(player.x - centerX)

          if (distance <= CENTER_BONUS_ZONE) {
            // 完美落点
            setCombo((prev) => prev + 1)
            setScore((prev) => prev + 2 + combo)
          } else {
            // 普通落点
            setCombo(0)
            setScore((prev) => prev + 1)
          }

          currentPlatformRef.current = i
          addNewPlatform()
          return true
        }
      }
    }

    return false
  }, [combo, addNewPlatform])

  // 游戏主循环
  useEffect(() => {
    if (gameStatus !== 'playing') {
      draw()
      return
    }

    const gameLoop = () => {
      const player = playerRef.current

      // 蓄力
      if (player.charging && mouseDownRef.current) {
        player.power = Math.min(player.power + 5, MAX_POWER)
      }

      // 物理更新
      if (!player.charging && !player.onGround) {
        player.vx *= 0.98 // 空气阻力
        player.vy += GRAVITY
        player.x += player.vx
        player.y += player.vy

        // 检查落地
        checkLanding()

        // 检查失败（掉到最低平台下方很远）
        const lowestPlatformY = Math.max(...platformsRef.current.map((p) => p.y))
        if (player.y > lowestPlatformY + CANVAS_HEIGHT / 2) {
          setGameStatus('over')
          if (score > bestScore) {
            setBestScore(score)
            localStorage.setItem('jumpjump-best-score', score.toString())
          }
          return
        }
      }

      draw()
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameStatus, draw, checkLanding, score, bestScore, combo])

  // 鼠标/触摸控制
  const handleMouseDown = useCallback(() => {
    if (gameStatus !== 'playing') return

    const player = playerRef.current
    // 只有在地面上才能蓄力
    if (player.onGround && !player.charging) {
      player.charging = true
      player.power = 0
      mouseDownRef.current = true
    }
  }, [gameStatus])

  const handleMouseUp = useCallback(() => {
    if (gameStatus !== 'playing') return

    const player = playerRef.current
    if (player.charging) {
      // 根据蓄力跳跃
      const angle = -75 * (Math.PI / 180) // 固定角度向前上方
      const power = Math.max(player.power / MAX_POWER, 0.3) // 最小30%力度
      const jumpForce = 8 + power * 12

      player.vx = Math.cos(angle) * jumpForce
      player.vy = Math.sin(angle) * jumpForce
      player.charging = false
      player.power = 0
      player.onGround = false
      mouseDownRef.current = false
    }
  }, [gameStatus])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameStatus === 'playing') {
        e.preventDefault()
        handleMouseDown()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameStatus === 'playing') {
        e.preventDefault()
        handleMouseUp()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameStatus, handleMouseDown, handleMouseUp])

  // 鼠标/触摸控制
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onMouseDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      handleMouseDown()
    }

    const onMouseUp = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      handleMouseUp()
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('touchstart', onMouseDown)
    canvas.addEventListener('touchend', onMouseUp)

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('touchstart', onMouseDown)
      canvas.removeEventListener('touchend', onMouseUp)
    }
  }, [handleMouseDown, handleMouseUp])

  // 初始化
  useEffect(() => {
    initGame()
  }, [initGame])

  return (
    <div className={styles.overlay}>
      <div className={styles.gameContainer}>
        <div className={styles.header}>
          <h2>跳一跳</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div className={styles.statsBar}>
          <div className={styles.stat}>得分: {score}</div>
          <div className={styles.stat}>最高: {bestScore}</div>
          {combo > 1 && <div className={styles.statCombo}>{combo}x 连击</div>}
        </div>

        <div className={styles.gameBoard}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className={styles.canvas}
          />

          {gameStatus === 'ready' && (
            <div className={styles.messageOverlay}>
              <div className={styles.message}>
                <h3>准备开始</h3>
                <p>长按空格或屏幕蓄力，松开跳跃</p>
                <p className={styles.hint}>落在中心区域获得连击</p>
                <button onClick={startGame} className={styles.btn}>
                  开始游戏
                </button>
              </div>
            </div>
          )}

          {gameStatus === 'over' && (
            <div className={styles.messageOverlay}>
              <div className={styles.message}>
                <h3>游戏结束</h3>
                <div className={styles.scoreBox}>
                  <p className={styles.finalScore}>
                    本次得分: <strong>{score}</strong>
                  </p>
                  <p className={styles.bestScoreText}>
                    最高分: <strong>{bestScore}</strong>
                  </p>
                </div>
                {score === bestScore && score > 0 && <p className={styles.congrats}>新纪录</p>}
                <button onClick={startGame} className={styles.btn}>
                  再来一次
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.instructions}>
          <p>长按空格或屏幕蓄力，松开跳跃</p>
          <p>落在中心获得连击加分</p>
        </div>
      </div>
    </div>
  )
}
