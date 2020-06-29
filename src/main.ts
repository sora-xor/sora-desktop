import '@babel/polyfill'
import '../theme/index.css'

import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import './hooks'
import './plugins'

const _onKeyPress = (e) => {
  const charCode = (e.which) ? e.which : e.keyCode
  if ((charCode > 31 && (charCode < 48 || charCode > 57)) && charCode !== 46) {
    e.preventDefault()
  } else {
    return true
  }
}

Vue.directive('numeric', {
  bind (el, binding, vnode) {
    const input = el.querySelector('input[type="text"]') as HTMLInputElement
    if (input) {
      input.addEventListener(
        'keypress',
        _onKeyPress
      )
    }
  },
  unbind (el, binding, vnode) {
    const input = el.querySelector('input[type="text"]') as HTMLInputElement
    if (input) {
      input.removeEventListener(
        'keypress',
        _onKeyPress
      )
    }
  }
})

Vue.config.productionTip = false
Vue.config.devtools = process.env.NODE_ENV === 'development'

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
