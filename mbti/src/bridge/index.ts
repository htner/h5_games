type PushHandler = (event: string, data: Record<string, any>) => void

let pushHandlers: PushHandler[] = []

const win = window as Window

function hasBridge(): boolean {
  return !!(win.chrome?.webview?.postMessage || win.FlutterBridge?.postMessage)
}

function postToBridge(type: string, payload: Record<string, any> = {}): void {
  const json = JSON.stringify({ type, payload })
  if (win.chrome?.webview?.postMessage) {
    win.chrome.webview.postMessage(json)
  } else if (win.FlutterBridge?.postMessage) {
    win.FlutterBridge.postMessage(json)
  } else {
    console.warn(`[bridge] Flutter bridge not available for "${type}"`)
  }
}

function callNative(method: string, data?: any): Promise<any> {
  return new Promise((resolve) => {
    if (win.flutter_inappwebview?.callHandler) {
      win.flutter_inappwebview.callHandler(method, data).then(resolve)
    } else if (win.webkit?.messageHandlers?.[method]) {
      win.webkit.messageHandlers[method].postMessage(data)
      resolve(undefined)
    } else {
      console.warn(`[bridge] native method "${method}" not available, trying Flutter bridge`)
      postToBridge(method, data)
      resolve(undefined)
    }
  })
}

setTimeout(() => {
  postToBridge('game_ready', { version: '1.0.0' })
}, 100)

export const bridge = {
  async getUserInfo(): Promise<{ uid: number; nickname: string; avatar_url: string; vip_level: number } | null> {
    return (await callNative('getUserInfo')) ?? null
  },

  async requestPay(itemId: string, amount: number): Promise<boolean> {
    return !!(await callNative('requestPay', { itemId, amount }))
  },

  async shareCard(imageUrl: string, text: string): Promise<void> {
    await callNative('shareCard', { imageUrl, text })
  },

  async triggerNativeEffect(effectType: string): Promise<void> {
    await callNative('triggerNativeEffect', { effectType })
  },

  onRoomPush(handler: PushHandler): void {
    pushHandlers.push(handler)
  },

  offRoomPush(handler: PushHandler): void {
    pushHandlers = pushHandlers.filter((h) => h !== handler)
  },
}

// ── Bridge-proxied API transport ──

let reqCounter = 0
const pendingRequests = new Map<
  string,
  { resolve: (v: any) => void; reject: (e: Error) => void }
>()

export function bridgeRequest(
  method: string,
  path: string,
  body?: Record<string, any>,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const reqId = `h5_${++reqCounter}_${Date.now()}`
    pendingRequests.set(reqId, { resolve, reject })
    postToBridge('api_request', { req_id: reqId, method, path, body })
    setTimeout(() => {
      if (pendingRequests.has(reqId)) {
        pendingRequests.delete(reqId)
        reject(new Error('bridge request timeout'))
      }
    }, 15_000)
  })
}

// ── Single onDartEvent handler for all event types ──

const previousHandler = win.onDartEvent

win.onDartEvent = (raw: string | object) => {
  try {
    const msg = typeof raw === 'string' ? JSON.parse(raw) : raw
    const { type, payload } = msg as { type: string; payload: Record<string, any> }

    // API response — resolve pending bridge requests
    if (type === 'api_response' && payload?.req_id) {
      const pending = pendingRequests.get(payload.req_id)
      if (pending) {
        pendingRequests.delete(payload.req_id)
        if (payload.ok) {
          pending.resolve(payload.data)
        } else {
          pending.reject(new Error(payload.error || 'request failed'))
        }
        return
      }
    }

    // Room push events — forward to registered handlers
    if (type === 'room_push' && payload?.event) {
      for (const handler of pushHandlers) {
        try {
          handler(payload.event, payload.data || {})
        } catch (e) {
          console.error('[bridge] push handler error:', e)
        }
      }
    }

    // Room context — store globally and notify handlers
    if (type === 'room_context' && payload) {
      win.__roomContext = payload as any
      win.__authUid = payload.uid
      for (const handler of pushHandlers) {
        try {
          handler('__room_context', payload)
        } catch (e) {
          console.error('[bridge] room_context handler error:', e)
        }
      }
    }
  } catch (e) {
    console.error('[bridge] onDartEvent parse error:', e)
  }

  if (typeof previousHandler === 'function') {
    previousHandler(raw as string)
  }
}

// Legacy direct push entry point
win.__onMBTIPush = (event: string, data: any) => {
  for (const handler of pushHandlers) {
    try {
      handler(event, typeof data === 'string' ? JSON.parse(data) : data)
    } catch (e) {
      console.error('[bridge] push handler error:', e)
    }
  }
}

export { hasBridge }
