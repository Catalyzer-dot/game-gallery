import React from 'react'
import { X } from '../icons/Icons'
import { useIconStyle } from '../icons/IconStyleContext'
import LoginButton from '../LoginButton'
import styles from './index.module.scss'

interface SettingsProps {
  onClose: () => void
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { style, setStyle } = useIconStyle()

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.closeBtn}>
          <X size={24} />
        </button>

        <h2 className={styles.title}>设置</h2>

        <div className={styles.form}>
          {/* 图标风格 */}
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

          {/* 账号登录部分 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>账号管理</h3>
            <LoginButton mode="full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export { Settings }
