import { BlankLayout } from '@renderer/layouts'
import { RouteModuleList } from '../typings'

const blankRoutes: RouteModuleList = [
  {
    path: '/blank',
    name: 'blankRoutes',
    component: BlankLayout,
    redirect: '/searchbar',
    meta: {
      title: '欢迎'
    },
    children: [
      {
        path: 'searchbar',
        name: 'searchbar',
        component: () => import('@renderer/views/searchbar/Index.vue')
      },
      {
        path: 'marketplace',
        name: 'marketplace',
        component: () => import('@renderer/views/marketplace/Index.vue')
      }
    ]
  }
]

export default blankRoutes
