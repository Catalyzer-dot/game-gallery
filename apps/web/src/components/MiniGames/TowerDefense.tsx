import React, { useState, useEffect, useCallback, useRef } from 'react'
import styles from './TowerDefense.module.scss'

// 游戏常量
const GRID_WIDTH = 20
const GRID_HEIGHT = 12
const CELL_SIZE = 40
const INITIAL_GOLD = 200
const INITIAL_LIVES = 20

// 类型定义
type CellType = 'empty' | 'path' | 'start' | 'end' | 'tower'

interface Position {
  x: number
  y: number
}

interface Enemy {
  id: number
  type: 'basic' | 'fast' | 'tank'
  hp: number
  maxHp: number
  position: Position
  pathIndex: number
  speed: number
  reward: number
}

interface Tower {
  id: number
  type: 'basic' | 'sniper'
  position: Position
  damage: number
  range: number
  fireRate: number
  lastFire: number
  cost: number
}

interface Level {
  id: number
  name: string
  path: Position[]
  waves: { type: Enemy['type']; count: number; interval: number }[][]
}

// 塔类型配置
const TOWER_TYPES = {
  basic: {
    name: '基础塔',
    damage: 10,
    range: 2.5,
    fireRate: 500,
    cost: 100,
    emoji: '🗼',
    color: '#3b82f6',
  },
  sniper: {
    name: '狙击塔',
    damage: 50,
    range: 5,
    fireRate: 1500,
    cost: 200,
    emoji: '🎯',
    color: '#ef4444',
  },
}

// 敌人类型配置
const ENEMY_TYPES = {
  basic: { hp: 50, speed: 0.02, reward: 10, emoji: '👾', color: '#22c55e' },
  fast: { hp: 30, speed: 0.04, reward: 15, emoji: '⚡', color: '#eab308' },
  tank: { hp: 150, speed: 0.015, reward: 30, emoji: '🛡️', color: '#ef4444' },
}

// 生成连续路径的辅助函数
function generateContinuousPath(waypoints: Position[]): Position[] {
  const path: Position[] = []

  for (let i = 0; i < waypoints.length; i++) {
    const waypoint = waypoints[i]

    // 添加当前路径点
    path.push({ ...waypoint })

    // 如果不是最后一个点，填充到下一个点之间的所有格子
    if (i < waypoints.length - 1) {
      const next = waypoints[i + 1]

      if (waypoint.x === next.x) {
        // 垂直移动
        const step = waypoint.y < next.y ? 1 : -1
        for (let y = waypoint.y + step; y !== next.y; y += step) {
          path.push({ x: waypoint.x, y })
        }
      } else if (waypoint.y === next.y) {
        // 水平移动
        const step = waypoint.x < next.x ? 1 : -1
        for (let x = waypoint.x + step; x !== next.x; x += step) {
          path.push({ x, y: waypoint.y })
        }
      }
    }
  }

  return path
}

// 关卡配置
const LEVELS: Level[] = [
  {
    id: 1,
    name: '第一关：入门',
    path: generateContinuousPath([
      { x: 0, y: 6 },
      { x: 5, y: 6 },
      { x: 5, y: 3 },
      { x: 12, y: 3 },
      { x: 12, y: 9 },
      { x: 19, y: 9 },
    ]),
    waves: [
      [{ type: 'basic', count: 5, interval: 1000 }],
      [{ type: 'basic', count: 8, interval: 800 }],
      [{ type: 'fast', count: 6, interval: 800 }],
    ],
  },
  {
    id: 2,
    name: '第二关：加速',
    path: generateContinuousPath([
      { x: 0, y: 3 },
      { x: 8, y: 3 },
      { x: 8, y: 8 },
      { x: 15, y: 8 },
      { x: 15, y: 2 },
      { x: 19, y: 2 },
    ]),
    waves: [
      [{ type: 'basic', count: 10, interval: 700 }],
      [{ type: 'fast', count: 8, interval: 600 }],
      [
        { type: 'basic', count: 5, interval: 500 },
        { type: 'fast', count: 5, interval: 500 },
      ],
      [{ type: 'tank', count: 3, interval: 1500 }],
    ],
  },
  {
    id: 3,
    name: '第三关：混战',
    path: generateContinuousPath([
      { x: 19, y: 6 },
      { x: 12, y: 6 },
      { x: 12, y: 2 },
      { x: 5, y: 2 },
      { x: 5, y: 10 },
      { x: 0, y: 10 },
    ]),
    waves: [
      [{ type: 'basic', count: 15, interval: 500 }],
      [{ type: 'fast', count: 12, interval: 400 }],
      [{ type: 'tank', count: 5, interval: 1200 }],
      [
        { type: 'basic', count: 10, interval: 400 },
        { type: 'fast', count: 10, interval: 400 },
      ],
      [{ type: 'tank', count: 8, interval: 1000 }],
    ],
  },
]

export const TowerDefense: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentLevel, setCurrentLevel] = useState(0)
  const [gold, setGold] = useState(INITIAL_GOLD)
  const [lives, setLives] = useState(INITIAL_LIVES)
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [towers, setTowers] = useState<Tower[]>([])
  const [selectedTowerType, setSelectedTowerType] = useState<keyof typeof TOWER_TYPES | null>(null)
  const [currentWave, setCurrentWave] = useState(0)
  const [isSpawning, setIsSpawning] = useState(false)
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null)

  const enemyIdRef = useRef(0)
  const towerIdRef = useRef(0)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastUpdateRef = useRef<number>(Date.now())

  const level = LEVELS[currentLevel]

  // 初始化网格
  const getCellType = useCallback(
    (x: number, y: number): CellType => {
      if (!level?.path) return 'empty'

      const isStart = level.path[0].x === x && level.path[0].y === y
      const isEnd =
        level.path[level.path.length - 1].x === x && level.path[level.path.length - 1].y === y
      const isPath = level.path.some((p) => p.x === x && p.y === y)
      const hasTower = towers.some((t) => t.position.x === x && t.position.y === y)

      if (hasTower) return 'tower'
      if (isStart) return 'start'
      if (isEnd) return 'end'
      if (isPath) return 'path'
      return 'empty'
    },
    [level, towers]
  )

  // 生成敌人
  const spawnWave = useCallback(() => {
    if (!level || currentWave >= level.waves.length) return

    setIsSpawning(true)
    const wave = level.waves[currentWave]

    let totalSpawned = 0
    const totalEnemies = wave.reduce((sum, group) => sum + group.count, 0)

    wave.forEach((group) => {
      const enemyType = ENEMY_TYPES[group.type]
      let spawned = 0

      const spawnInterval = setInterval(() => {
        if (spawned < group.count) {
          const enemy: Enemy = {
            id: enemyIdRef.current++,
            type: group.type,
            hp: enemyType.hp,
            maxHp: enemyType.hp,
            position: { ...level.path[0] },
            pathIndex: 0,
            speed: enemyType.speed,
            reward: enemyType.reward,
          }
          setEnemies((prev) => [...prev, enemy])
          spawned++
          totalSpawned++

          if (totalSpawned >= totalEnemies) {
            setIsSpawning(false)
          }
        } else {
          clearInterval(spawnInterval)
        }
      }, group.interval)
    })

    setCurrentWave((prev) => prev + 1)
  }, [level, currentWave])

  // 建造塔
  const buildTower = useCallback(
    (x: number, y: number) => {
      if (!selectedTowerType) return
      if (getCellType(x, y) !== 'empty') return

      const towerConfig = TOWER_TYPES[selectedTowerType]
      if (gold < towerConfig.cost) return

      const tower: Tower = {
        id: towerIdRef.current++,
        type: selectedTowerType,
        position: { x, y },
        damage: towerConfig.damage,
        range: towerConfig.range,
        fireRate: towerConfig.fireRate,
        lastFire: 0,
        cost: towerConfig.cost,
      }

      setTowers((prev) => [...prev, tower])
      setGold((prev) => prev - towerConfig.cost)
      setSelectedTowerType(null)
    },
    [selectedTowerType, gold, getCellType]
  )

  // 游戏主循环
  useEffect(() => {
    if (gameStatus !== 'playing' || !level) {
      return
    }

    const gameLoop = () => {
      const now = Date.now()
      const deltaTime = now - lastUpdateRef.current
      lastUpdateRef.current = now

      // 更新敌人位置
      setEnemies((prevEnemies) => {
        const updated = prevEnemies.map((enemy) => {
          if (enemy.pathIndex >= level.path.length - 1) return enemy

          const current = level.path[enemy.pathIndex]
          const next = level.path[enemy.pathIndex + 1]
          const dx = next.x - current.x
          const dy = next.y - current.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          const moveAmount = enemy.speed * deltaTime
          const progress = moveAmount / distance

          let newX = enemy.position.x + dx * progress
          let newY = enemy.position.y + dy * progress
          let newPathIndex = enemy.pathIndex

          const distToNext = Math.sqrt(Math.pow(newX - next.x, 2) + Math.pow(newY - next.y, 2))
          if (distToNext < 0.1) {
            newX = next.x
            newY = next.y
            newPathIndex++
          }

          return { ...enemy, position: { x: newX, y: newY }, pathIndex: newPathIndex }
        })

        // 检查到达终点的敌人
        const reachedEnd = updated.filter(
          (e) =>
            e.pathIndex >= level.path.length - 1 &&
            Math.abs(e.position.x - level.path[level.path.length - 1].x) < 0.1 &&
            Math.abs(e.position.y - level.path[level.path.length - 1].y) < 0.1
        )

        if (reachedEnd.length > 0) {
          setLives((prev) => Math.max(0, prev - reachedEnd.length))
        }

        return updated.filter(
          (e) =>
            !(
              e.pathIndex >= level.path.length - 1 &&
              Math.abs(e.position.x - level.path[level.path.length - 1].x) < 0.1 &&
              Math.abs(e.position.y - level.path[level.path.length - 1].y) < 0.1
            )
        )
      })

      // 塔攻击
      setTowers((prevTowers) => {
        const updatedTowers = prevTowers.map((tower) => {
          if (now - tower.lastFire < tower.fireRate) return tower

          setEnemies((prevEnemies) => {
            const inRange = prevEnemies.filter((enemy) => {
              const dx = enemy.position.x - tower.position.x
              const dy = enemy.position.y - tower.position.y
              const distance = Math.sqrt(dx * dx + dy * dy)
              return distance <= tower.range
            })

            if (inRange.length === 0) return prevEnemies

            const target = inRange[0]
            const updatedEnemies = prevEnemies.map((enemy) => {
              if (enemy.id === target.id) {
                return { ...enemy, hp: enemy.hp - tower.damage }
              }
              return enemy
            })

            const deadEnemies = updatedEnemies.filter((e) => e.hp <= 0)
            if (deadEnemies.length > 0) {
              setGold((prev) => prev + deadEnemies.reduce((sum, e) => sum + e.reward, 0))
            }

            return updatedEnemies.filter((e) => e.hp > 0)
          })

          return { ...tower, lastFire: now }
        })
        return updatedTowers
      })

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameStatus, level])

  // 检查游戏状态
  useEffect(() => {
    if (!level) return

    if (lives <= 0) {
      setGameStatus('lost')
    } else if (currentWave >= level.waves.length && enemies.length === 0 && !isSpawning) {
      setGameStatus('won')
    }
  }, [lives, currentWave, enemies.length, isSpawning, level])

  // 下一关
  const nextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel((prev) => prev + 1)
      resetGame()
    }
  }

  // 重置游戏
  const resetGame = () => {
    setGold(INITIAL_GOLD)
    setLives(INITIAL_LIVES)
    setEnemies([])
    setTowers([])
    setCurrentWave(0)
    setGameStatus('playing')
    setSelectedTowerType(null)
    enemyIdRef.current = 0
    towerIdRef.current = 0
  }

  // 渲染网格
  const renderGrid = () => {
    const cells = []
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cellType = getCellType(x, y)
        const isHovered = hoveredCell?.x === x && hoveredCell?.y === y
        const canBuild =
          selectedTowerType && cellType === 'empty' && gold >= TOWER_TYPES[selectedTowerType].cost

        cells.push(
          <div
            key={`${x}-${y}`}
            className={`${styles.cell} ${styles[cellType]} ${isHovered && canBuild ? styles.canBuild : ''}`}
            style={{
              left: x * CELL_SIZE,
              top: y * CELL_SIZE,
            }}
            onClick={() => buildTower(x, y)}
            onMouseEnter={() => setHoveredCell({ x, y })}
            onMouseLeave={() => setHoveredCell(null)}
          />
        )
      }
    }
    return cells
  }

  if (!level) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.gameContainer}>
        <div className={styles.header}>
          <h2>塔防：{level.name}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div className={styles.statsBar}>
          <div className={styles.stat}>💰 {gold}</div>
          <div className={styles.stat}>❤️ {lives}</div>
          <div className={styles.stat}>
            波次: {currentWave}/{level.waves.length}
          </div>
        </div>

        <div className={styles.towerSelection}>
          {Object.entries(TOWER_TYPES).map(([key, config]) => (
            <button
              key={key}
              className={`${styles.towerBtn} ${selectedTowerType === key ? styles.selected : ''} ${
                gold < config.cost ? styles.disabled : ''
              }`}
              onClick={() => setSelectedTowerType(key as keyof typeof TOWER_TYPES)}
              disabled={gold < config.cost}
            >
              <span className={styles.towerEmoji}>{config.emoji}</span>
              <span className={styles.towerName}>{config.name}</span>
              <span className={styles.towerCost}>{config.cost}💰</span>
            </button>
          ))}
        </div>

        <div className={styles.gameBoard}>
          <div
            className={styles.grid}
            style={{
              width: GRID_WIDTH * CELL_SIZE,
              height: GRID_HEIGHT * CELL_SIZE,
            }}
          >
            {renderGrid()}

            {towers.map((tower) => {
              const config = TOWER_TYPES[tower.type]
              return (
                <div
                  key={tower.id}
                  className={styles.tower}
                  style={{
                    left: tower.position.x * CELL_SIZE,
                    top: tower.position.y * CELL_SIZE,
                  }}
                >
                  {config.emoji}
                </div>
              )
            })}

            {enemies.map((enemy) => {
              const config = ENEMY_TYPES[enemy.type]
              return (
                <div
                  key={enemy.id}
                  className={styles.enemy}
                  style={{
                    left: enemy.position.x * CELL_SIZE,
                    top: enemy.position.y * CELL_SIZE,
                  }}
                >
                  <div className={styles.enemyEmoji}>{config.emoji}</div>
                  <div className={styles.healthBar}>
                    <div
                      className={styles.healthFill}
                      style={{
                        width: `${(enemy.hp / enemy.maxHp) * 100}%`,
                        backgroundColor: config.color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.controls}>
          {currentWave < level.waves.length && !isSpawning && (
            <button onClick={spawnWave} className={styles.waveBtn}>
              开始第 {currentWave + 1} 波
            </button>
          )}
          {isSpawning && <div className={styles.spawning}>敌人来袭...</div>}
        </div>

        {gameStatus === 'won' && (
          <div className={styles.messageOverlay}>
            <div className={styles.message}>
              <h3>关卡完成！</h3>
              <p>剩余生命: {lives}</p>
              <p>剩余金币: {gold}</p>
              {currentLevel < LEVELS.length - 1 ? (
                <button onClick={nextLevel} className={styles.btn}>
                  下一关
                </button>
              ) : (
                <>
                  <p className={styles.congrats}>🎉 恭喜通关所有关卡！</p>
                  <button
                    onClick={() => {
                      setCurrentLevel(0)
                      resetGame()
                    }}
                    className={styles.btn}
                  >
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
              <h3>游戏失败</h3>
              <p>防线被攻破了</p>
              <button onClick={resetGame} className={styles.btn}>
                重试
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
