import { Vue, Component } from 'vue-property-decorator'
import debounce from 'lodash/debounce'
import { State, Action } from 'vuex-class'

@Component
export default class IdleHandler extends Vue {
  timerId: number | undefined

  created () {
    this.registerEvents()
  }

  @State(state => state.Settings.security.time) msBeforeIdle

  get resetTimer () {
    return debounce(() => {
      if (this.timerId) window.clearTimeout(this.timerId)
      this.timerId = window.setTimeout(this.beforeIdle, this.msBeforeIdle)
    }, 1000)
  }

  @Action openIdleScreen

  registerEvents () {
    document.addEventListener('mousemove', this.resetTimer)
    document.addEventListener('keyup', this.resetTimer)
  }

  beforeIdle () {
    document.removeEventListener('mousemove', this.resetTimer)
    document.removeEventListener('keyup', this.resetTimer)
    this.openIdleScreen()
  }
}
