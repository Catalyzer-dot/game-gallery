import { useEffect, useRef, useState } from 'react'
import { Settings2 } from 'lucide-react'
import styles from './index.module.scss'

interface Props {
  showAdvancedPosition: boolean
  onToggleAdvancedPosition: () => void
}

export default function Settings({ showAdvancedPosition, onToggleAdvancedPosition }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Settings2 size={14} />
        <span>设置</span>
      </button>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="持仓显示设置">
          <div className={styles.panelHead}>
            <strong>持仓显示</strong>
            <span>控制“当前持有”上的 hover 输入行为。</span>
          </div>
          <div className={styles.settingRow}>
            <div className={styles.settingText}>
              <strong>启用份额和成本价输入</strong>
              <span>开启后 hover 当前持有，可输入持有份额和持仓成本价。</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showAdvancedPosition}
              aria-label="显示份额和成本价"
              className={styles.switchBtn}
              data-on={showAdvancedPosition}
              onClick={onToggleAdvancedPosition}
            >
              <span className={styles.switchTrack}>
                <span className={styles.switchThumb} />
              </span>
              <span className={styles.switchLabel}>
                {showAdvancedPosition ? '已开启' : '已关闭'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
