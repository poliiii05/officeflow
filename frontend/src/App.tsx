import { useEffect, useState } from 'react'
import { api } from './lib/api'

type HealthResponse = {
  data: {
    status: string
    service: string
  }
  message: string
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)

  useEffect(() => {
    api.get<HealthResponse>('/health').then((response) => {
      setHealth(response.data)
    })
  }, [])

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1>OfficeFlow</h1>
      <p>React frontend connected to Laravel API.</p>

      <pre>
        {health ? JSON.stringify(health, null, 2) : 'Checking API...'}
      </pre>
    </main>
  )
}

export default App