import Vue from 'vue'
import Router from 'vue-router'

import Store from '@/store'

Vue.use(Router)

export const lazyComponent = (name) => () => import(`@/components/${name}.vue`)

const defaultRouter = new Router({
  mode: 'hash',
  routes: [
    {
      path: '/',
      component: lazyComponent('Home'),
      children: [
        {
          path: 'wallets',
          name: 'wallets',
          component: lazyComponent('Wallets/WalletsPage'),
          children: [
            {
              path: ':walletId',
              component: lazyComponent('Wallets/Wallet')
            }
          ]
        },
        {
          path: 'exchange',
          name: 'exchange',
          component: lazyComponent('Exchange/ExchangePage')
        },
        {
          path: 'settlements',
          name: 'settlements-page',
          component: lazyComponent('Settlements/SettlementsPage'),
          children: [
            {
              path: 'history',
              name: 'settlements-history',
              component: lazyComponent('Settlements/SettlementsHistory')
            },
            {
              path: 'incoming',
              name: 'settlements-incoming',
              component: lazyComponent('Settlements/SettlementsIncoming')
            },
            {
              path: 'outgoing',
              name: 'settlements-outgoing',
              component: lazyComponent('Settlements/SettlementsOutgoing')
            }
          ]
        },
        {
          path: 'transactions',
          name: 'transactions',
          component: lazyComponent('Transactions/TransactionPage')
        },
        {
          path: 'settings',
          name: 'settings',
          component: lazyComponent('Settings/SettingsPage')
        }
      ],
      beforeEnter: async (to, from, next) => {
        if (Store.getters.userAuthorized) {
          return next()
        }
        next({ name: 'login' })
      }
    },
    {
      path: '/idle',
      name: 'idle',
      component: lazyComponent('Security/IdlePage')
    },
    {
      path: '/login',
      name: 'login',
      component: lazyComponent('Login'),
      beforeEnter: async (to, from, next) => {
        const status = await Store.dispatch('checkAccountSession')
        if (status) {
          return next({ name: 'idle' })
        }
        next()
      }
    },
    {
      path: '/signup',
      name: 'signup',
      component: lazyComponent('Signup')
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})

export default defaultRouter
