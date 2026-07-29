/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('ReconnectingWebSocket', () => {
  let MockWebSocket: any

  beforeEach(() => {
    MockWebSocket = vi.fn()
    MockWebSocket.CONNECTING = 0
    MockWebSocket.OPEN = 1
    MockWebSocket.CLOSING = 2
    MockWebSocket.CLOSED = 3

    vi.stubGlobal('WebSocket', MockWebSocket)
  })

  it('connects on connect()', async () => {
    const { ReconnectingWebSocket } = await import('../websocket')
    const ws = new ReconnectingWebSocket('ws://test/ws')
    ws.connect()
    expect(MockWebSocket).toHaveBeenCalledWith('ws://test/ws')
  })

  it('calls onMessage when receiving data', async () => {
    const { ReconnectingWebSocket } = await import('../websocket')
    const ws = new ReconnectingWebSocket('ws://test/ws')
    const handler = vi.fn()
    ws.onMessage(handler)
    ws.connect()

    const instance = MockWebSocket.mock.instances[0]
    instance.onopen()
    instance.onmessage({ data: JSON.stringify({ event: 'test', data: { key: 'val' } }) })

    expect(handler).toHaveBeenCalledWith({ event: 'test', data: { key: 'val' } })
  })

  it('notifies status changes', async () => {
    const { ReconnectingWebSocket } = await import('../websocket')
    const ws = new ReconnectingWebSocket('ws://test/ws')
    const handler = vi.fn()
    ws.onStatusChange(handler)
    ws.connect()

    const instance = MockWebSocket.mock.instances[0]
    instance.onopen()
    expect(handler).toHaveBeenCalledWith('connected')
  })

  it('reconnects on close', async () => {
    vi.useFakeTimers()
    const { ReconnectingWebSocket } = await import('../websocket')
    const ws = new ReconnectingWebSocket('ws://test/ws')
    const handler = vi.fn()
    ws.onStatusChange(handler)
    ws.connect()

    const instance = MockWebSocket.mock.instances[0]
    instance.onopen()
    expect(MockWebSocket).toHaveBeenCalledTimes(1)

    instance.onclose()
    expect(handler).toHaveBeenCalledWith('disconnected')

    vi.advanceTimersByTime(1000)
    expect(MockWebSocket).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenCalledWith('reconnecting')

    vi.useRealTimers()
  })

  it('sends data when connected', async () => {
    const { ReconnectingWebSocket } = await import('../websocket')
    const ws = new ReconnectingWebSocket('ws://test/ws')
    ws.connect()

    const instance = MockWebSocket.mock.instances[0]
    instance.readyState = 1
    instance.send = vi.fn()

    ws.send({ key: 'val' })
    expect(instance.send).toHaveBeenCalledWith(JSON.stringify({ key: 'val' }))
  })

  it('does not send when not connected', async () => {
    const { ReconnectingWebSocket } = await import('../websocket')
    const ws = new ReconnectingWebSocket('ws://test/ws')
    ws.connect()

    const instance = MockWebSocket.mock.instances[0]
    instance.readyState = 3
    instance.send = vi.fn()

    ws.send({ key: 'val' })
    expect(instance.send).not.toHaveBeenCalled()
  })

  it('disconnect cleans up', async () => {
    const { ReconnectingWebSocket } = await import('../websocket')
    const ws = new ReconnectingWebSocket('ws://test/ws')
    ws.connect()

    const instance = MockWebSocket.mock.instances[0]
    instance.close = vi.fn()

    ws.disconnect()
    expect(instance.close).toHaveBeenCalled()
  })

  it('ignores malformed messages', async () => {
    const { ReconnectingWebSocket } = await import('../websocket')
    const ws = new ReconnectingWebSocket('ws://test/ws')
    const handler = vi.fn()
    ws.onMessage(handler)
    ws.connect()

    const instance = MockWebSocket.mock.instances[0]
    instance.onmessage({ data: 'not json' })
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('buildWsUrl', () => {
  it('converts http to ws', async () => {
    const { buildWsUrl } = await import('../websocket')
    expect(buildWsUrl('http://localhost:8000/api/v1', '/ws/gps')).toBe('ws://localhost:8000/ws/gps')
  })

  it('converts https to wss', async () => {
    const { buildWsUrl } = await import('../websocket')
    expect(buildWsUrl('https://example.com/api/v1', '/ws/scan')).toBe('wss://example.com/ws/scan')
  })
})
