import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './index.module.scss'

interface SettingsButtonProps {
  children?: ReactNode
  onClose?: () => void
}

function SettingsButton({ children, onClose }: SettingsButtonProps) {
  const [open, setOpen] = useState(false)

  const handleClose = () => {
    setOpen(false)
    onClose?.()
  }

  return (
    <>
      <button
        className={styles.trigger}
        onClick={() => setOpen(true)}
        title="设置"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          width="20"
          height="20"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {open && createPortal(
        <div className={styles.overlay} onClick={handleClose}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={handleClose}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="20"
                height="20"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <h2 className={styles.title}>设置</h2>

            <div className={styles.body}>
              {children}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export { SettingsButton }
