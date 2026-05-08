/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  __roomContext?: {
    uid: number
    room_id: string
    room_type: string
    is_host?: boolean
    nickname?: string
    avatar_url?: string
  }
  __authUid?: number
  __authToken?: string
  onDartEvent?: (data: string | object) => void
  __onMBTIPush?: (event: string, data: any) => void
  chrome?: {
    webview?: {
      postMessage: (msg: string) => void
    }
  }
  FlutterBridge?: {
    postMessage: (msg: string) => void
  }
  flutter_inappwebview?: {
    callHandler: (name: string, data?: any) => Promise<any>
  }
  webkit?: {
    messageHandlers?: Record<string, { postMessage: (data: any) => void }>
  }
}
