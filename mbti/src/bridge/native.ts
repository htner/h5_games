type PushCallback = (event: string, data: any) => void

let pushCallbacks: PushCallback[] = []

function postToFlutter(type: string, payload: Record<string, any> = {}): void {
  const msg = JSON.stringify({ type, payload })
  const w = window as any
  if (w.chrome?.webview?.postMessage) {
    w.chrome.webview.postMessage(msg)
  } else if (w.FlutterBridge?.postMessage) {
    w.FlutterBridge.postMessage(msg)
  } else {
    console.warn(`[bridge] Flutter bridge not available for "${type}"`)
  }
}

function callNative(method: string, params?: Record<string, any>): Promise<any> {
  return new Promise((resolve) => {
    const w = window as any
    if (w.flutter_inappwebview?.callHandler) {
      w.flutter_inappwebview.callHandler(method, params).then(resolve)
    } else if (w.webkit?.messageHandlers?.[method]) {
      w.webkit.messageHandlers[method].postMessage(params)
      resolve(undefined)
    } else {
      console.warn(`[bridge] native method "${method}" not available, trying Flutter bridge`)
      postToFlutter(method, params)
      resolve(undefined)
    }
  })
}

// Notify Flutter that the MBTI H5 game is ready
setTimeout(() => {
  postToFlutter('game_ready', { version: '1.0.0' })
}, 100)

export const bridge = {
  async getUserInfo(): Promise<{ uid: number; nickname: string; avatar_url: string; vip_level: number } | null> {
    const result = await callNative('getUserInfo')
    return result ?? null
  },

  async requestPay(itemId: string, amount: number): Promise<boolean> {
    const result = await callNative('requestPay', { itemId, amount })
    return !!result
  },

  async shareCard(imageUrl: string, text: string): Promise<void> {
    await callNative('shareCard', { imageUrl, text })
  },

  async triggerNativeEffect(effectType: string): Promise<void> {
    await callNative('triggerNativeEffect', { effectType })
  },

  onRoomPush(callback: PushCallback): void {
    pushCallbacks.push(callback)
  },

  offRoomPush(callback: PushCallback): void {
    pushCallbacks = pushCallbacks.filter(cb => cb !== callback)
  },
}

// Receive events from Flutter GameBridge via window.onDartEvent.
// Chain with any previously registered handler (e.g. http.ts api_response).
const _prevOnDartEvent = (window as any).onDartEvent
;(window as any).onDartEvent = (raw: string) => {
  try {
    const msg = typeof raw === 'string' ? JSON.parse(raw) : raw
    const { type, payload } = msg

    if (type === 'room_push' && payload?.event) {
      for (const cb of pushCallbacks) {
        try {
          cb(payload.event, payload.data || {})
        } catch (e) {
          console.error('[bridge] push handler error:', e)
        }
      }
    }

    if (type === 'room_context' && payload) {
      const w = window as any
      w.__roomContext = payload
      w.__authUid = payload.uid
    }
  } catch (e) {
    console.error('[bridge] onDartEvent parse error:', e)
  }
  if (typeof _prevOnDartEvent === 'function') {
    _prevOnDartEvent(raw)
  }
}

// Also support direct invocation for testing / fallback
;(window as any).__onMBTIPush = (event: string, data: any) => {
  for (const cb of pushCallbacks) {
    try {
      cb(event, typeof data === 'string' ? JSON.parse(data) : data)
    } catch (e) {
      console.error('[bridge] push handler error:', e)
    }
  }
}
