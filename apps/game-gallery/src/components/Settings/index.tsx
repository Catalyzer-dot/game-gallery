import React from 'react'
import { useIconStyle } from '../icons/IconStyleContext'
import { LoginButton, SettingsButton } from '@degenerates/ui'
import styles from './index.module.scss'

interface SettingsProps {
  onClose?: () => void
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { style, setStyle } = useIconStyle()

  return (
    <SettingsButton onClose={onClose}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>图标风格</h3>
        <div className={styles.styleToggle}>
          <button
            className={`${styles.styleOption} ${style === 'pixel' ? styles.styleOptionActive : ''}`}
            onClick={() => setStyle('pixel')}
          >
            Pixel
          </button>
          <button
            className={`${styles.styleOption} ${style === 'cyberpunk' ? styles.styleOptionActive : ''}`}
            onClick={() => setStyle('cyberpunk')}
          >
            Cyberpunk
          </button>
          <button
            className={`${styles.styleOption} ${style === 'anime' ? styles.styleOptionActive : ''}`}
            onClick={() => setStyle('anime')}
          >
            Anime
          </button>
        </div>
      </div>

      <LoginButton mode="full" />
    </SettingsButton>
  )
}

export { Settings }
