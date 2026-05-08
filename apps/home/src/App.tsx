import { LoginButton, SettingsButton } from '@degenerates/ui'

const DEV_PORTS: Record<string, number> = {
  '/game-gallery/': 5173,
  '/fund/': 5174,
}

function resolveHref(path: string): string {
  if (import.meta.env.DEV && DEV_PORTS[path]) {
    return `http://localhost:${DEV_PORTS[path]}`
  }
  return path
}

const apps = [
  {
    title: 'Game Gallery',
    description: 'Steam game collection tracker with status management and search.',
    href: '/game-gallery/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
      </svg>
    ),
    color: '#6366f1',
  },
  {
    title: 'Fund Tracker',
    description: 'Private fund portfolio tracker with real-time data.',
    href: '/fund/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    color: '#10b981',
  },
]

export default function App() {
  return (
    <div className="page">
      <div className="settings-corner">
        <SettingsButton>
          <LoginButton mode="full" />
        </SettingsButton>
      </div>

      <header className="hero">
        <h1 className="title">Degenerates</h1>
        <p className="subtitle">A collection of tools built for fun.</p>
      </header>

      <nav className="grid">
        {apps.map((app) => (
          <a
            key={app.href}
            href={resolveHref(app.href)}
            className="card"
            style={{ '--accent': app.color } as React.CSSProperties}
          >
            <div className="card-icon">{app.icon}</div>
            <div className="card-body">
              <h2>{app.title}</h2>
              <p>{app.description}</p>
            </div>
            <div className="card-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        ))}
      </nav>

      <footer className="footer">
        <p>degenerates.site</p>
      </footer>
    </div>
  )
}
