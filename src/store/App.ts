import Vue from 'vue'
import map from 'lodash/fp/map'
import flatMap from 'lodash/fp/flatMap'
import concat from 'lodash/fp/concat'
import fromPairs from 'lodash/fp/fromPairs'
import flow from 'lodash/fp/flow'
import { getParsedItem, setStringifyItem } from '@/util/storage/local'
import configUtil from '@/util/config-util'
import irohaUtil from '@/util/iroha'

const types = flow(
  flatMap(x => [x + '_REQUEST', x + '_SUCCESS', x + '_FAILURE']),
  concat([
    'APPROVAL_DIALOG_OPEN',
    'APPROVAL_DIALOG_CLOSE',
    'UPLOAD_TRANSACTION_DIALOG_OPEN',
    'UPLOAD_TRANSACTION_DIALOG_CLOSE',
    'LOAD_WALLETS_SORT_CRITERION',
    'UPDATE_WALLETS_SORT_CRITERION'
  ]),
  map(x => [x, x]),
  fromPairs
)([
  'SEND_CUSTOM_TRANSACTION',
  'LOAD_CONFIGURATION_FILE'
])

function initialState () {
  return {
    approvalDialog: {
      isVisible: false,
      signatures: [],
      resolvePrompting: null,
      rejectPrompting: null,
      requiredMinAmount: 1
    },
    uploadTransactionDialog: {
      isVisible: false,
      transaction: {},
      onSuccess: () => {},
      resolvePrompting: null,
      rejectPrompting: null
    },
    connectionError: null,
    walletsSortCriterion: null,
    nodeIPs: [],
    registrationIPs: [],
    services: null
  }
}

function handleError (state, err) {
  state.connectionError = err
}

const state = initialState()

const mutations = {
  [types.APPROVAL_DIALOG_OPEN] (state, { resolvePrompting, rejectPrompting, signatures, requiredMinAmount }) {
    Vue.set(state, 'approvalDialog', {
      isVisible: true,
      resolvePrompting,
      rejectPrompting,
      signatures,
      requiredMinAmount
    })
  },
  [types.APPROVAL_DIALOG_CLOSE] (state, privateKeys) {
    Vue.set(state.approvalDialog, 'isVisible', false)
    Vue.set(state.approvalDialog, 'signatures', [])
    state.approvalDialog.resolvePrompting(privateKeys)
  },

  [types.UPLOAD_TRANSACTION_DIALOG_OPEN] (state, { resolvePrompting, rejectPrompting, transaction, onSuccess }) {
    Vue.set(state, 'uploadTransactionDialog', {
      isVisible: true,
      transaction,
      onSuccess,
      resolvePrompting,
      rejectPrompting
    })
  },

  [types.UPLOAD_TRANSACTION_DIALOG_CLOSE] (state) {
    Vue.set(state.uploadTransactionDialog, 'isVisible', false)
    Vue.set(state.uploadTransactionDialog, 'transaction', {})
    Vue.set(state.uploadTransactionDialog, 'onSuccess', () => {})
    state.uploadTransactionDialog.resolvePrompting()
  },

  [types.LOAD_WALLETS_SORT_CRITERION] (state, criterion) {
    state.walletsSortCriterion = criterion
  },
  [types.UPDATE_WALLETS_SORT_CRITERION] (state, criterion) {
    state.walletsSortCriterion = criterion
  },

  [types.LOAD_CONFIGURATION_FILE_REQUEST] (state) {},
  [types.LOAD_CONFIGURATION_FILE_SUCCESS] (state, config) {
    state.nodeIPs = config.nodes
    state.registrationIPs = config.registrations

    state.services = config.services
  },
  [types.LOAD_CONFIGURATION_FILE_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.SEND_CUSTOM_TRANSACTION_REQUEST] () {},
  [types.SEND_CUSTOM_TRANSACTION_SUCCESS] () {},
  [types.SEND_CUSTOM_TRANSACTION_FAILURE] () {}
}

const actions = {
  /*
   * openApprovalDialog returns a Promise and closeApprovalDialog resolves it.
   * This allows the caller to simply chain postprocesses like this:
   * ```
   *  openApprovalDialog().then(input => ...)
   * ```
   *
   * It does a hacky way of exporting resolve/reject outside Promise in order to
   * resolve the Promise at closeApprovalDialog.
   * c.f. https://stackoverflow.com/questions/26150232/resolve-javascript-promise-outside-function-scope
   */
  openApprovalDialog ({ commit }, { signatures = [], requiredMinAmount = 1 } = {}) {
    let resolvePrompting, rejectPrompting
    const prompting = new Promise((resolve, reject) => {
      resolvePrompting = resolve
      rejectPrompting = reject
    })

    commit(types.APPROVAL_DIALOG_OPEN, {
      resolvePrompting,
      rejectPrompting,
      signatures,
      requiredMinAmount
    })

    return prompting
  },
  closeApprovalDialog ({ commit }, privateKeys) {
    commit(types.APPROVAL_DIALOG_CLOSE, privateKeys)
  },
  openUploadTransactionDialog ({ commit }, { transaction = {}, onSuccess = () => {} } = {}) {
    let resolvePrompting, rejectPrompting
    const prompting = new Promise((resolve, reject) => {
      resolvePrompting = resolve
      rejectPrompting = reject
    })

    commit(types.UPLOAD_TRANSACTION_DIALOG_OPEN, {
      resolvePrompting,
      rejectPrompting,
      transaction,
      onSuccess
    })

    return prompting
  },
  closeUploadTransactionDialog ({ commit }) {
    commit(types.UPLOAD_TRANSACTION_DIALOG_CLOSE)
  },
  loadWalletsSortCriterion ({ commit }) {
    const criterion = getParsedItem('walletsSortCriterion')

    if (criterion) {
      commit(types.LOAD_WALLETS_SORT_CRITERION, criterion)
    }
  },
  updateWalletsSortCriterion ({ commit }, criterion) {
    setStringifyItem('walletsSortCriterion', criterion)
    commit(types.UPDATE_WALLETS_SORT_CRITERION, criterion)
  },

  loadConfiguration ({ commit }) {
    commit(types.LOAD_CONFIGURATION_FILE_REQUEST)

    return configUtil.getConfiguration()
      .then(config => commit(types.LOAD_CONFIGURATION_FILE_SUCCESS, config))
      .catch(err => {
        commit(types.LOAD_CONFIGURATION_FILE_FAILURE)
        throw err
      })
  },

  sendBinaryTransaction ({ commit }, bytes) {
    commit(types.SEND_CUSTOM_TRANSACTION_REQUEST)
    return irohaUtil.sendBinaryTransaction(bytes)
      .then(() => commit(types.SEND_CUSTOM_TRANSACTION_SUCCESS))
      .catch(err => {
        commit(types.SEND_CUSTOM_TRANSACTION_FAILURE, err)
        throw err
      })
  }
}

const getters = {
  approvalDialogVisible () {
    return state.approvalDialog.isVisible
  },
  approvalDialogSignatures () {
    return state.approvalDialog.signatures
  },
  approvalDialogMinAmountKeys () {
    return state.approvalDialog.requiredMinAmount
  },
  uploadTransactionDialogVisible () {
    return state.uploadTransactionDialog.isVisible
  },
  uploadTransactionDialogTransaction () {
    return state.uploadTransactionDialog.transaction
  },
  uploadTransactionDialogSuccessFunction () {
    return state.uploadTransactionDialog.onSuccess
  },
  walletsSortCriterion (state) {
    return state.walletsSortCriterion
  },
  nodeIPs (state) {
    return state.nodeIPs
  },
  registrationIPs (state) {
    return state.registrationIPs
  },
  servicesIPs (state) {
    return state.services
  }
}

export default {
  types,
  state,
  getters,
  mutations,
  actions
}
