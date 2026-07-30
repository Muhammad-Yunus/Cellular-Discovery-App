type WSEventHandler = (data: unknown) => void
type WSStatus = 'connected' | 'disconnected' | 'reconnecting'
type WSStatusHandler = (status: WSStatus) => void

export class ReconnectingWebSocket {
  private url: string
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxRetries = 5
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private isActive = true
  private messageHandlers = new Set<WSEventHandler>()
  private statusHandlers = new Set<WSStatusHandler>()

  constructor(url: string) {
    this.url = url
  }

  connect() {
    if (!this.isActive || this.ws?.readyState === WebSocket.OPEN) return

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.notifyStatus('connected')
      }

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          this.messageHandlers.forEach(h => h(data))
        } catch {
          // ignore malformed messages
        }
      }

      this.ws.onclose = () => {
        this.notifyStatus('disconnected')
        if (this.isActive && this.reconnectAttempts < this.maxRetries) {
          this.notifyStatus('reconnecting')
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000)
          this.reconnectTimer = setTimeout(() => {
            this.reconnectAttempts++
            this.connect()
          }, delay)
        }
      }

      this.ws.onerror = () => {
        this.ws?.close()
      }
    } catch {
      this.notifyStatus('disconnected')
    }
  }

  disconnect() {
    this.isActive = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.ws?.close()
    this.ws = null
  }

  send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  onMessage(handler: WSEventHandler) {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onStatusChange(handler: WSStatusHandler) {
    this.statusHandlers.add(handler)
    return () => this.statusHandlers.delete(handler)
  }

  private notifyStatus(status: WSStatus) {
    this.statusHandlers.forEach(h => h(status))
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export function buildWsUrl(apiBase: string, path: string): string {
  // API base is an absolute HTTP/HTTPS URL when running in production or
  // when using a direct remote address. In that case convert to WS/WSS and strip /api/v1.
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    const base = apiBase.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '')
    return `${base}${path}`
  } else {
    // Relative API base (e.g., '/api/v1') – combine with current page location.
    // This works for development where the frontend and backend are on different origins
    // and we rely on a proxy to forward WebSocket requests.
    const cleanApiBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}${cleanApiBase}${path}`;
    }
    // Fallback for SSR/testing – just concatenate.
    return `${apiBase}${path}`;
  }
}
