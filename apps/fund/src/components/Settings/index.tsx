import { LoginButton, SettingsButton } from '@degenerates/ui'
import styles from './index.module.scss'

interface Props {
  showAdvancedPosition: boolean
  onToggleAdvancedPosition: () => void
}

export default function Settings({ showAdvancedPosition, onToggleAdvancedPosition }: Props) {
  return (
    <SettingsButton>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <strong>持仓显示</strong>
          <span>控制"当前持有"上的 hover 输入行为。</span>
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
            <span className={styles.switchLabel}>{showAdvancedPosition ? '已开启' : '已关闭'}</span>
          </button>
        </div>
      </div>

      <LoginButton mode="full" />
    </SettingsButton>
  )
}
