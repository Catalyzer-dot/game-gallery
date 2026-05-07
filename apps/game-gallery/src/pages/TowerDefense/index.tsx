import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import styles from './index.module.scss'

function TowerDefensePage() {
  const navigate = useNavigate()
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')

  const handleBack = () => {
    navigate('/')
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={handleBack}>
        <ArrowLeft size={20} />
        <span>返回</span>
      </button>
      <iframe
        className={styles.gameFrame}
        src={`${basePath}/godot-tower-defense/index.html`}
        title="Tower Defense"
        allowFullScreen
      />
    </div>
  )
}

export { TowerDefensePage }
