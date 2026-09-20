import { useEffect, useState } from 'react'
import { Badge } from '../../../ui/design-system/components/core/Badge.jsx'
import { Button } from '../../../ui/design-system/components/core/Button.jsx'
import { Card } from '../../../ui/design-system/components/surfaces/Card.jsx'
import { getHealth } from '../api/health'

type BackendState = 'checking' | 'ready' | 'unavailable'

export function SystemStatus() {
  const [backend, setBackend] = useState<BackendState>('checking')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setBackend('checking')
    getHealth(controller.signal)
      .then(() => setBackend('ready'))
      .catch(() => { if (!controller.signal.aborted) setBackend('unavailable') })
    return () => controller.abort()
  }, [attempt])

  return <main className="status-page by-container">
    <div className="by-eyebrow by-eyebrow--tick">BENYAN · SYSTEM STATUS</div>
    <h1>System Status</h1>
    <p className="by-lead">Web application and backend connectivity</p>
    <Card accent className="status-card">
      <div className="status-card__top"><h2>Backend</h2><Badge tone={backend === 'ready' ? 'success' : backend === 'unavailable' ? 'risk' : 'neutral'} dot>{backend.toUpperCase()}</Badge></div>
      <p aria-live="polite">{backend === 'ready' ? 'Backend ready · ok' : backend === 'checking' ? 'Checking backend…' : 'Backend unavailable'}</p>
      <Button variant="secondary" size="sm" onClick={() => setAttempt(value => value + 1)}>Check again</Button>
    </Card>
  </main>
}
