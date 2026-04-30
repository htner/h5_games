import axios from 'axios'

// ---------------------------------------------------------------------------
// Bridge detection: when running inside Flutter WebView, route API calls
// through the Dart bridge (api_request → api_response) so auth headers,
// base URL, etc. are handled by the native layer. Falls back to direct
// axios for standalone dev mode (vite dev server + proxy).
// ---------------------------------------------------------------------------

const w = window as any
const hasBridge = () => !!(w.chrome?.webview?.postMessage || w.FlutterBridge?.postMessage)

let _reqIdCounter = 0
const _pendingRequests = new Map<string, { resolve: (v: any) => void; reject: (e: any) => void }>()

function postToFlutter(type: string, payload: Record<string, any> = {}): void {
  const msg = JSON.stringify({ type, payload })
  if (w.chrome?.webview?.postMessage) {
    w.chrome.webview.postMessage(msg)
  } else if (w.FlutterBridge?.postMessage) {
    w.FlutterBridge.postMessage(msg)
  }
}

function bridgeRequest(method: string, path: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const reqId = `h5_${++_reqIdCounter}_${Date.now()}`
    _pendingRequests.set(reqId, { resolve, reject })
    postToFlutter('api_request', { req_id: reqId, method, path, body })
    setTimeout(() => {
      if (_pendingRequests.has(reqId)) {
        _pendingRequests.delete(reqId)
        reject(new Error('bridge request timeout'))
      }
    }, 15000)
  })
}

// Listen for api_response from Flutter via onDartEvent
const _origOnDartEvent = w.onDartEvent
w.onDartEvent = (raw: string) => {
  try {
    const msg = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (msg.type === 'api_response' && msg.payload?.req_id) {
      const pending = _pendingRequests.get(msg.payload.req_id)
      if (pending) {
        _pendingRequests.delete(msg.payload.req_id)
        if (msg.payload.ok) {
          pending.resolve(msg.payload.data)
        } else {
          pending.reject(new Error(msg.payload.error || 'request failed'))
        }
        return
      }
    }
  } catch (_) { /* pass through */ }
  // Forward to any previously registered handler (bridge/native.ts)
  if (typeof _origOnDartEvent === 'function') {
    _origOnDartEvent(raw)
  }
}

// ---------------------------------------------------------------------------
// Unified http interface — same API surface regardless of bridge/direct mode
// ---------------------------------------------------------------------------

const directHttp = axios.create({
  baseURL: '/mbti/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

directHttp.interceptors.request.use((config) => {
  const token = w.__authToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

directHttp.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data.res_code && data.res_code !== 0) {
      return Promise.reject(new Error(data.res_message || 'unknown error'))
    }
    return data
  },
  (error) => Promise.reject(error),
)

const http = {
  async get<T = any, R = any>(path: string, opts?: { params?: Record<string, any> }): Promise<R> {
    if (hasBridge()) {
      const qs = opts?.params
        ? '?' + Object.entries(opts.params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
        : ''
      return bridgeRequest('GET', `/mbti/v1${path}${qs}`)
    }
    const resp = await directHttp.get<T, any>(path, opts)
    return resp
  },

  async post<T = any, R = any>(path: string, body?: any): Promise<R> {
    if (hasBridge()) {
      return bridgeRequest('POST', `/mbti/v1${path}`, body)
    }
    const resp = await directHttp.post<T, any>(path, body)
    return resp
  },
}

export default http
