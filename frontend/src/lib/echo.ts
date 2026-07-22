import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

type PusherConnector = {
  pusher: {
    connection: {
      bind: (event: string, callback: (...args: unknown[]) => void) => void
    }
  }
}

window.Pusher = Pusher

if (import.meta.env.DEV) {
  Pusher.logToConsole = true
}

export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST ?? '127.0.0.1',
  wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
  wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
  forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
})

if (import.meta.env.DEV) {
  const pusher = (echo.connector as unknown as PusherConnector).pusher

  pusher.connection.bind('connected', () => {
    console.log('[reverb] connected')
  })

  pusher.connection.bind('error', (error: unknown) => {
    console.error('[reverb] error', error)
  })
}