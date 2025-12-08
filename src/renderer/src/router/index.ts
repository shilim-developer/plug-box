import { App } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import blankRoutes from './routes/blankRoutes'

export const router = createRouter({
  routes: [...blankRoutes],
  history: createWebHashHistory(),
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export function setupRouter(app: App) {
  app.use(router)
}
