import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { setupRouter } from './router'
import VueDOMPurifyHTML from 'vue-dompurify-html'

const app = createApp(App)
setupRouter(app)
app.use(VueDOMPurifyHTML)
app.mount('#app')
