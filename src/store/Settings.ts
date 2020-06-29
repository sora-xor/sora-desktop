import Vue from 'vue'
import map from 'lodash/fp/map'
import fromPairs from 'lodash/fp/fromPairs'
import flow from 'lodash/fp/flow'
import omit from 'lodash/fp/omit'
import isEqual from 'lodash/fp/isEqual'
import flatMap from 'lodash/fp/flatMap'
import concat from 'lodash/fp/concat'
import { getParsedItem, setParsedItem, setStringifyItem, clearStorage } from '@/util/storage/local'
import { TxBuilder } from 'iroha-helpers/lib/chain'
import { createRegistrationProof } from '@/util/web3-util'

const types = flow(
  flatMap(x => [x + '_REQUEST', x + '_SUCCESS', x + '_FAILURE']),
  concat([
    'LOAD_SETTINGS',
    'UPDATE_SETTINGS_VIEW_FIAT',
    'UPDATE_SETTINGS_VIEW_CRYPTO',
    'UPDATE_SETTINGS_VIEW_TIMEZONE',
    'UPDATE_SETTINGS_SECURITY_OTS',
    'UPDATE_SETTINGS_SECURITY_PASSWORD',
    'UPDATE_SETTINGS_SECURITY_IDLE_TIME'
  ]),
  map(x => [x, x]),
  fromPairs
)([
  'CREATE_REGISTRATION_PROOF'
])

function initialState () {
  return {
    default: {
      fiatCurrencies: ['RUB', 'USD', 'EUR'],
      cryptoCurrencies: ['BTC', 'ETH', 'XRP']
    },
    view: {
      fiat: 'RUB',
      crypto: 'BTC',
      timezone: '(UTC+03:00) Moscow, St. Petersburg, Volgograd, Minsk'
    },
    security: {
      ots: false,
      password: false,
      time: 5 * 60 * 1000
    }
  }
}

const state = initialState()

const getters = {
  isOtsEnabled (state) {
    return state.security.ots
  },
  isPasswordEnabled (state) {
    return state.security.password
  },
  settingsView (state) {
    return state.view
  },
  settingsFiatCurrencies (state) {
    return state.default.fiatCurrencies
  },
  settingsCryptoCurrencies (state) {
    return state.default.cryptoCurrencies
  },
  settingsTimeIdle (state) {
    return state.security.time / 60 / 1000
  }
}

const mutations = {
  [types.LOAD_SETTINGS] (state, storage) {
    if (!isEqual(state, storage)) {
      Object.keys(state).map(key => {
        if (key !== 'default' && storage[key]) {
          state[key] = storage[key]
        }
      })
    }
  },

  [types.UPDATE_SETTINGS_VIEW_FIAT] (state, fiat) {
    Vue.set(state.view, 'fiat', fiat)
  },
  [types.UPDATE_SETTINGS_VIEW_CRYPTO] (state, crypto) {
    Vue.set(state.view, 'crypto', crypto)
  },
  [types.UPDATE_SETTINGS_VIEW_TIMEZONE] (state, timezone) {
    Vue.set(state.view, 'timezone', timezone)
  },
  [types.UPDATE_SETTINGS_SECURITY_OTS] (state, status) {
    Vue.set(state.security, 'ots', status)
  },
  [types.UPDATE_SETTINGS_SECURITY_PASSWORD] (state, status) {
    Vue.set(state.security, 'password', status)
  },
  [types.UPDATE_SETTINGS_SECURITY_IDLE_TIME] (state, milliseconds) {
    Vue.set(state.security, 'time', milliseconds)
  },

  [types.CREATE_REGISTRATION_PROOF_REQUEST] () {},
  [types.CREATE_REGISTRATION_PROOF_SUCCESS] () {},
  [types.CREATE_REGISTRATION_PROOF_FAILURE] () {}
}

const actions = {
  loadSettings ({ commit, state }) {
    const packageVersion = process.env.VUE_SORA_PACKAGE_VERSION
    const version = getParsedItem('version')
    if (!version) {
      clearStorage()
      setParsedItem('version.v', packageVersion)
    }
    if (version && version.v !== packageVersion) {
      clearStorage()
      setParsedItem('version.v', packageVersion)
    }
    const storage = getParsedItem('settings')
    if (storage) {
      commit(types.LOAD_SETTINGS, storage)
    } else {
      setStringifyItem('settings', omit('default')(state))
    }
  },
  updateSettingsViewFiat ({ commit }, fiat) {
    setParsedItem('settings.view.fiat', fiat)
    commit(types.UPDATE_SETTINGS_VIEW_FIAT, fiat)
  },
  updateSettingsViewCrypto ({ commit }, crypto) {
    setParsedItem('settings.view.crypto', crypto)
    commit(types.UPDATE_SETTINGS_VIEW_CRYPTO, crypto)
  },
  updateSettingsViewTime ({ commit }, timezone) {
    setParsedItem('settings.view.timezone', timezone)
    commit(types.UPDATE_SETTINGS_VIEW_TIMEZONE, timezone)
  },
  updateSecurityOtsStatus ({ commit }, status) {
    setParsedItem('settings.security.ots', status)
    commit(types.UPDATE_SETTINGS_SECURITY_OTS, status)
  },
  updateSecurityPasswordStatus ({ commit }, status) {
    setParsedItem('settings.security.password', status)
    commit(types.UPDATE_SETTINGS_SECURITY_PASSWORD, status)
  },
  updateSecurityIdleTime ({ commit }, time) {
    const milliseconds = time * 60 * 1000
    setParsedItem('settings.security.time', milliseconds)
    commit(types.UPDATE_SETTINGS_SECURITY_IDLE_TIME, milliseconds)
  },

  signUpWithEthereumWallet ({ commit, getters }, { accountId, irohaQuorum, privateKeys, ethPrivateKey }) {
    // commit(types.CREATE_REGISTRATION_PROOF_REQUEST)
    // commit(types.CREATE_REGISTRATION_PROOF_SUCCESS)
    // commit(types.CREATE_REGISTRATION_PROOF_FAILURE)
    const key = 'register_wallet'
    const ethAccountId = 'eth_registration_service@notary'
    const { privateKey, ...value } = createRegistrationProof(ethPrivateKey)
    const transaction = new TxBuilder()
      .setAccountDetail({
        accountId: ethAccountId,
        key,
        // eslint-disable-next-line
        value: JSON.stringify(value).replace(/"/g, '\\\"')
      })
      .addMeta(
        getters.accountId || accountId,
        getters.irohaQuorum || irohaQuorum
      )
      .sign(privateKeys)
      .tx
    return { privateKey, transaction }
  }
}

export default {
  types,
  state,
  getters,
  mutations,
  actions
}
