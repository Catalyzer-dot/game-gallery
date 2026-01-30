import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import styles from './index.module.scss'

interface AddGameProps {
  onAdd: (name: string, steamUrl?: string) => void
}

export const AddGame: React.FC<AddGameProps> = ({ onAdd }) => {
  const [name, setName] = useState('')
  const [steamUrl, setSteamUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onAdd(name.trim(), steamUrl.trim() || undefined)
      setName('')
      setSteamUrl('')
    }
  }

  return (
    <div className={styles.addContainer}>
      <form className={styles.addForm} onSubmit={handleSubmit}>
        <input
          type="text"
          className={styles.inputPrimary}
          placeholder="Enter game name to add..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          className={styles.inputPrimary}
          placeholder="Steam URL (可选)"
          value={steamUrl}
          onChange={(e) => setSteamUrl(e.target.value)}
        />
        <button type="submit" className={styles.btnAdd}>
          <Plus size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Add Game
        </button>
      </form>
    </div>
  )
}
