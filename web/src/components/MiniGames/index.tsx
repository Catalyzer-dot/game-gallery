import React, { useState } from 'react'
import { SnakeGame } from './SnakeGame'
import styles from './index.module.scss'

interface MiniGame {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

const miniGames: MiniGame[] = [
  {
    id: 'snake',
    name: '贪吃蛇',
    description: '经典贪吃蛇游戏，控制蛇吃食物并避免撞墙',
    icon: '🐍',
    color: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
  },
]

interface MiniGamesProps {
  onClose: () => void
}

export const MiniGames: React.FC<MiniGamesProps> = ({ onClose: _onClose }) => {
  const [activeGame, setActiveGame] = useState<string | null>(null)

  const handlePlayGame = (gameId: string) => {
    setActiveGame(gameId)
  }

  const handleCloseGame = () => {
    setActiveGame(null)
  }

  return (
    <>
      <div className={styles.playgroundContainer}>
        <div className={styles.gamesSection}>
          <div className={styles.gamesGrid}>
            {miniGames.map((game) => (
              <div
                key={game.id}
                className={styles.gameCard}
                onClick={() => handlePlayGame(game.id)}
              >
                <div className={styles.cardInner}>
                  <div className={styles.gameIcon}>{game.icon}</div>
                  <div className={styles.gameInfo}>
                    <h3 className={styles.gameName}>{game.name}</h3>
                    <p className={styles.gameDescription}>{game.description}</p>
                  </div>
                  <button className={styles.playBtn} onClick={(e) => { e.stopPropagation(); handlePlayGame(game.id) }}>
                    开始游戏 <span className={styles.playIcon}>▶</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeGame === 'snake' && <SnakeGame onClose={handleCloseGame} />}
    </>
  )
}
