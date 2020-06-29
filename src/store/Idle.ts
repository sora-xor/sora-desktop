import Vue from 'vue'
import map from 'lodash/fp/map'
import flatMap from 'lodash/fp/flatMap'
import concat from 'lodash/fp/concat'
import fromPairs from 'lodash/fp/fromPairs'
import flow from 'lodash/fp/flow'
import electronStore from '@/util/storage/electron'
import aesUtil from '@/util/aes-util'
import router from '@/router'

const types = flow(
  flatMap(x => [x + '_REQUEST', x + '_SUCCESS', x + '_FAILURE']),
  concat([
    'RESET',
    'CHECK_ACCOUNT_SESSION',
    'SET_ACCOUNT_SESSION',
    'RESET_ACCOUNT_SESSION',
    'IDLE_ACCOUNT_SESSION',
    'PASSWORD_CHECK_DIALOG_OPEN',
    'PASSWORD_CHECK_DIALOG_CLOSE'
  ]),
  map(x => [x, x]),
  fromPairs
)([
  'LOGIN_WITH_SESSION',
  'CHECK_SESSION_PASSWORD'
])

function initialState () {
  return {
    session: {
      authorized: false,
      idle: false
    },
    passwordDialog: {
      isVisible: false,
      resolvePrompting: null,
      rejectPrompting: null
    }
  }
}

const state = initialState()

const getters = {
  userAuthorized (state) {
    return state.session.authorized
  }
}

const mutations = {
  [types.RESET] (state) {
    const s = initialState()
    Object.keys(s).forEach(key => {
      state[key] = s[key]
    })
  },

  [types.CHECK_ACCOUNT_SESSION] (state) {},

  [types.SET_ACCOUNT_SESSION] (state) {
    Vue.set(state.session, 'authorized', true)
    Vue.set(state.session, 'idle', false)
  },

  [types.RESET_ACCOUNT_SESSION] (state) {
    Vue.set(state.session, 'authorized', false)
  },

  [types.IDLE_ACCOUNT_SESSION] (state) {
    Vue.set(state.session, 'authorized', false)
    Vue.set(state.session, 'idle', true)
  },

  [types.LOGIN_WITH_SESSION_REQUEST] (state) {},
  [types.LOGIN_WITH_SESSION_SUCCESS] (state) {
    Vue.set(state.session, 'authorized', true)
    Vue.set(state.session, 'idle', false)
  },
  [types.LOGIN_WITH_SESSION_FAILURE] (state) {},

  [types.CHECK_SESSION_PASSWORD_REQUEST] (state) {},
  [types.CHECK_SESSION_PASSWORD_SUCCESS] (state) {},
  [types.CHECK_SESSION_PASSWORD_FAILURE] (state) {},

  [types.PASSWORD_CHECK_DIALOG_OPEN] (state, { resolvePrompting, rejectPrompting }) {
    Vue.set(state, 'passwordDialog', {
      isVisible: true,
      resolvePrompting,
      rejectPrompting
    })
  },
  [types.PASSWORD_CHECK_DIALOG_CLOSE] (state, { isClosed }) {
    Vue.set(state.passwordDialog, 'isVisible', false)
    if (!isClosed) {
      state.passwordDialog.resolvePrompting()
    } else {
      state.passwordDialog.rejectPrompting(
        new Error('Password window closed')
      )
    }
  }
}

const actions = {
  checkAccountSession ({ commit }) {
    commit(types.CHECK_ACCOUNT_SESSION)
    if (!electronStore.has('user')) {
      return false
    }
    return true
  },
  async setAccountSession ({ commit }, { username, privateKey, nodeIp, password }) {
    commit(types.SET_ACCOUNT_SESSION)
    const pk = await aesUtil.encrypt(privateKey, password)
    electronStore.set('user', {
      username,
      pk,
      nodeIp
    })
  },
  resetAccountSession ({ commit }) {
    electronStore.clear()
    commit(types.RESET_ACCOUNT_SESSION)
    commit(types.RESET)
  },
  openIdleScreen ({ commit }) {
    commit(types.IDLE_ACCOUNT_SESSION)
    router.push({ name: 'idle' })
  },
  async loginWithSession ({ commit, dispatch }, { password }) {
    commit(types.LOGIN_WITH_SESSION_REQUEST)
    const { username, pk, nodeIp } = electronStore.get('user')
    const privateKey = await aesUtil.decryptPrivateKey(pk, password)
    try {
      await dispatch('login', { username, privateKey, nodeIp })
      commit(types.LOGIN_WITH_SESSION_SUCCESS)
      return Promise.resolve()
    } catch (error) {
      commit(types.LOGIN_WITH_SESSION_FAILURE)
    }
  },
  async checkPassword ({ commit }, { password }) {
    commit(types.CHECK_SESSION_PASSWORD_REQUEST)
    const { pk } = electronStore.get('user')
    try {
      await aesUtil.decryptPrivateKey(pk, password)
      commit(types.CHECK_SESSION_PASSWORD_SUCCESS)
    } catch (error) {
      commit(types.CHECK_SESSION_PASSWORD_FAILURE)
      throw error
    }
  },
  async updatePassword ({ commit, dispatch }, { oldPassword, newPassword }) {
    const { username, pk, nodeIp } = electronStore.get('user')
    try {
      const privateKey = await aesUtil.decryptPrivateKey(pk, oldPassword)
      dispatch('setAccountSession', {
        username,
        privateKey,
        nodeIp,
        password: newPassword
      })
    } catch (error) {
      throw error
    }
  },
  openPasswordDialog ({ commit }) {
    let resolvePrompting, rejectPrompting
    const prompting = new Promise((resolve, reject) => {
      resolvePrompting = resolve
      rejectPrompting = reject
    })

    commit(types.PASSWORD_CHECK_DIALOG_OPEN, {
      resolvePrompting,
      rejectPrompting
    })

    return prompting
  },
  closePasswordDialog ({ commit }, { isClosed }) {
    commit(types.PASSWORD_CHECK_DIALOG_CLOSE, { isClosed })
  }
}

export default {
  types,
  state,
  getters,
  mutations,
  actions
}
