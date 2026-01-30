import React, { useState, useEffect, useCallback } from 'react'
import styles from './MemoryGame.module.scss'

interface Card {
  id: number
  emoji: string
  isFlipped: boolean
  isMatched: boolean
}

const EMOJIS = ['🎮', '🎯', '🎲', '🎸', '🎨', '🎭', '🎪', '🎬']

export const MemoryGame: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [canFlip, setCanFlip] = useState(true)

  const initializeGame = useCallback(() => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }))
    setCards(shuffled)
    setFlippedCards([])
    setMoves(0)
    setMatchedPairs(0)
    setGameWon(false)
    setCanFlip(true)
  }, [])

  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  useEffect(() => {
    if (matchedPairs === EMOJIS.length) {
      setGameWon(true)
    }
  }, [matchedPairs])

  useEffect(() => {
    if (flippedCards.length === 2) {
      setCanFlip(false)
      const [first, second] = flippedCards
      const firstCard = cards[first]
      const secondCard = cards[second]

      if (firstCard.emoji === secondCard.emoji) {
        // 匹配成功
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((card) =>
              card.id === first || card.id === second ? { ...card, isMatched: true } : card
            )
          )
          setMatchedPairs((prev) => prev + 1)
          setFlippedCards([])
          setCanFlip(true)
        }, 600)
      } else {
        // 不匹配，翻回去
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((card) =>
              card.id === first || card.id === second ? { ...card, isFlipped: false } : card
            )
          )
          setFlippedCards([])
          setCanFlip(true)
        }, 1000)
      }
    }
  }, [flippedCards, cards])

  const handleCardClick = (id: number) => {
    if (!canFlip || flippedCards.length >= 2) return

    const card = cards[id]
    if (card.isFlipped || card.isMatched) return

    setCards((prevCards) => prevCards.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)))

    setFlippedCards((prev) => {
      const newFlipped = [...prev, id]
      if (newFlipped.length === 2) {
        setMoves((m) => m + 1)
      }
      return newFlipped
    })
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.gameContainer}>
        <div className={styles.header}>
          <h2>记忆翻牌</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div className={styles.scoreBoard}>
          <div className={styles.score}>步数: {moves}</div>
          <div className={styles.score}>
            配对: {matchedPairs}/{EMOJIS.length}
          </div>
          <button onClick={initializeGame} className={styles.restartBtn}>
            重新开始
          </button>
        </div>

        <div className={styles.board}>
          {cards.map((card) => (
            <div
              key={card.id}
              className={`${styles.card} ${card.isFlipped || card.isMatched ? styles.flipped : ''} ${
                card.isMatched ? styles.matched : ''
              }`}
              onClick={() => handleCardClick(card.id)}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardFront}>?</div>
                <div className={styles.cardBack}>{card.emoji}</div>
              </div>
            </div>
          ))}
        </div>

        {gameWon && (
          <div className={styles.messageOverlay}>
            <div className={styles.message}>
              <h3>恭喜通关！</h3>
              <p>总步数: {moves}</p>
              <p>完美配对需要: {EMOJIS.length} 步</p>
              <button onClick={initializeGame} className={styles.restartBtn}>
                再玩一次
              </button>
            </div>
          </div>
        )}

        <div className={styles.instructions}>
          <p>🎯 点击翻牌，找出所有配对</p>
          <p>💡 记住卡片位置，用最少步数完成</p>
        </div>
      </div>
    </div>
  )
}
