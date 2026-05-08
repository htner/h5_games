import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/global.css'

// Bridge must be imported early so handlers are registered
import './bridge'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
