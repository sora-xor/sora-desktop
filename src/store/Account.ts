import Vue from 'vue'
import map from 'lodash/fp/map'
import flatMap from 'lodash/fp/flatMap'
import concat from 'lodash/fp/concat'
import fromPairs from 'lodash/fp/fromPairs'
import flow from 'lodash/fp/flow'
import find from 'lodash/fp/find'
import cloneDeep from 'lodash/fp/cloneDeep'
import flatten from 'lodash/fp/flatten'
import { grpc } from 'grpc-web-client'
import { txHelper } from 'iroha-helpers'
import irohaUtil from '@/util/iroha'
import notaryUtil from '@/util/notary-util'
import collectorUtil from '@/util/collector-util'
import { getFormatedCommandsFrom, findBatchFromRaw } from '@/util/store-util'
import { WalletTypes, BillingTypes } from '@/data/consts'
import billingUtil from '@/util/billing-util'
import brvsUtil from '@/util/brvs-util'

// TODO: Move it into notary's API so we have the same list
import ASSETS from '@/util/crypto-list.json'
import { derivePublicKey } from 'ed25519.js'

// TODO: Need to create file where we can store such variables

const getBrvsAccount = (userAccount) => {
  if (window['Cypress']) return 'brvs@brvs'
  if (!userAccount) return 'undefined@brvs'

  return `${userAccount.split('@')[1]}@brvs`
}

const types = flow(
  flatMap(x => [x + '_REQUEST', x + '_SUCCESS', x + '_FAILURE']),
  concat([
    'RESET',
    'SET_NOTARY_IP'
  ]),
  map(x => [x, x]),
  fromPairs
)([
  'SIGNUP',
  'LOGIN',
  'LOGOUT',
  'UPDATE_ACCOUNT',
  'GET_ACCOUNT_TRANSACTIONS',
  'GET_ACCOUNT_ASSET_TRANSACTIONS',
  'GET_ACCOUNT_ASSET_TRANSACTIONS_NP',
  'GET_ACCOUNT_ASSETS',
  'GET_ALL_ASSET_TRANSACTIONS',
  'GET_ACCOUNT_SIGNATORIES',
  'GET_ALL_UNSIGNED_TRANSACTIONS',
  'ADD_ACCOUNT_SIGNATORY',
  'REMOVE_ACCOUNT_SIGNATORY',
  'TRANSFER_ASSET',
  'CREATE_SETTLEMENT',
  'ACCEPT_SETTLEMENT',
  'REJECT_SETTLEMENT',
  'SIGN_PENDING',
  'GET_ACCOUNT_QUORUM',
  'GET_BILLING_DATA',
  'CHECK_BRVS_REGISTRATION',
  'GET_MASTER_CONTRACT_ADDRESS'
])

function initialState () {
  return {
    accountId: '',
    accountPublicKey: '',
    nodeIp: '',
    notaryIp: notaryUtil.baseURL,
    accountInfo: {},
    accountQuorum: 0,
    accountSignatories: [],
    assetTransactions: {},
    rawUnsignedTransactions: [],
    rawTransactions: [],
    assets: [],
    connectionError: null,
    acceptSettlementLoading: false,
    rejectSettlementLoading: false,

    transferFee: {},
    custodyFee: {},
    accountCreationFee: {},
    exchangeFee: {},
    withdrawalFee: {},

    brvsRegistration: false,

    ethMasterContractAddress: ''
  }
}

const state = initialState()

const getters = {
  // TODO: Need to update this function due to all avaliable token already safed in iroha
  wallets (state, getters) {
    const wallets = state.assets.map(a => {
      // TODO: it is to get asset's properties (e.g. color) which cannot be fetched from API.
      const assetParts = a.assetId.split('#')
      const assetName = assetParts[0].toLowerCase()

      const wallet = {
        id: a.assetId.replace(/#/g, '$'),
        assetId: a.assetId,
        domain: assetParts[1],
        amount: a.balance,
        billingId: a.assetId.replace(/#/g, '__')
      }

      const ASSET = ASSETS.find(d =>
        d.name.toLowerCase() === assetName || d.asset.toLowerCase() === assetName)

      if (ASSET) {
        return {
          ...wallet,
          name: ASSET.name,
          asset: ASSET.asset,
          color: ASSET.color,
          precision: ASSET.precision
        }
      }
    })

    return wallets.filter(Boolean)
  },

  getTransactionsByAssetId: (state) => (assetId) => {
    return state.assetTransactions[assetId] ? getFormatedCommandsFrom(
      state.assetTransactions[assetId].transactionsList,
      state.accountId,
      true
    ) : []
  },

  getPaginationMetaByAssetId: (state) => (assetId) => {
    return state.assetTransactions[assetId]
  },

  allAssetsTransactions () {
    const txs = Object.values(state.assetTransactions)
      .map((a: any) => a.transactionsList)
    return flatten(txs)
  },

  pendingTransactions: (state) => {
    const pendingTransactionsCopy = cloneDeep(state.rawUnsignedTransactions)
    return !Array.isArray(pendingTransactionsCopy) ? getFormatedCommandsFrom(
      pendingTransactionsCopy.toObject().transactionsList,
      state.accountId,
      false
    ).filter((tx: any) => {
      return tx.payload.reducedPayload.creatorAccountId === state.accountId
    }) : []
  },

  walletType (state) {
    const walletType: symbol[] = []
    if (find('ethereum_wallet', state.accountInfo)) {
      walletType.push(WalletTypes.ETH)
    }

    return walletType
  },

  ethMasterContractAddress (state) {
    return state.ethMasterContractAddress
  },

  hasEthWallet (state, getters) {
    return getters.wallets.some(w => w.domain === 'ethereum')
  },

  ethWhiteListAddresses (state, getters) {
    const wallet = find('eth_whitelist', state.accountInfo)
    const whitelist = wallet ? JSON.parse(wallet.eth_whitelist) : []

    if (whitelist.length > 0 && getters.ethWhiteListAddressesAll.length === 0) {
      return whitelist
    }

    return getters.ethWhiteListAddressesAll
      .filter(([address, _]) => address.length)
      .filter(([_, time]) => parseInt(time) * 1000 < Date.now())
      .map(([address, _]) => address)
  },

  ethWhiteListAddressesAll (state) {
    const brvsAccount = getBrvsAccount(state.accountId)
    const brvsInfo = state.accountInfo[brvsAccount]
    const brvsWhitelist = brvsInfo ? brvsInfo.eth_whitelist : null
    if (brvsWhitelist) {
      const brvsWhitelistParsed = JSON.parse(brvsWhitelist)
      return Object.entries(brvsWhitelistParsed)
    }

    return []
  },

  accountQuorum (state, getters) {
    // User quorum is based on amount of signatories
    if (state.brvsRegistration) {
      return getters.accountSignatories.length
    }
    return getters.irohaQuorum
  },

  irohaQuorum (state, getters) {
    // TODO: Need to better way to handle this
    if (window['Cypress']) return state.accountQuorum
    if (state.brvsRegistration) {
      return getters.accountSignatories.length * 2
    }
    return state.accountQuorum
  },

  accountSignatories (state) {
    if (state.brvsRegistration) {
      const brvsUserSignatories = state.accountInfo[getBrvsAccount(state.accountId)]
        ? state.accountInfo[getBrvsAccount(state.accountId)].user_keys
        : null

      if (brvsUserSignatories) {
        return JSON.parse(brvsUserSignatories)
      }
    }

    return state.accountSignatories
  },

  rejectSettlementLoading (state) {
    return state.rejectSettlementLoading
  },

  acceptSettlementLoading (state) {
    return state.acceptSettlementLoading
  },

  accountId (state) {
    return state.accountId
  },

  transferFee (state) {
    return state.transferFee
  },

  custodyFee (state) {
    return state.custodyFee
  },

  accountCreationFee (state) {
    return state.accountCreationFee
  },

  exchangeFee (state) {
    return state.exchangeFee
  },

  withdrawalFee (state) {
    return state.withdrawalFee
  },

  accountEthAddress (state) {
    const obj = find('ethereum_wallet', state.accountInfo)
    if (obj && obj.ethereum_wallet) {
      return obj.ethereum_wallet
    }
    return ''
  }
}

/**
 * Store a connection error so the top component can handle it.
 * @param {Object} state
 * @param {Error} err
 */
function handleError (state, err) {
  switch (err.code) {
    case grpc.Code.Unavailable:
    case grpc.Code.Canceled:
      state.connectionError = err
      break

    default:
      state.connectionError = null
  }
}

const mutations = {
  [types.SET_NOTARY_IP] (state, ip) {
    notaryUtil.baseURL = ip
    state.notaryIp = ip
  },

  [types.RESET] (state) {
    const s = initialState()

    Object.keys(s).forEach(key => {
      state[key] = s[key]
    })
  },

  [types.SIGNUP_REQUEST] (state) {},

  [types.SIGNUP_SUCCESS] (state, params) {
  },

  [types.SIGNUP_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.LOGIN_REQUEST] (state) {},

  [types.LOGIN_SUCCESS] (state, { account, privateKey }) {
    const publicKey = derivePublicKey(
      Buffer.from(privateKey, 'hex')
    ).toString('hex')
    state.accountId = account.accountId
    state.accountPublicKey = publicKey.toUpperCase()
    state.accountInfo = JSON.parse(account.jsonData)
    state.accountQuorum = account.quorum
  },

  [types.LOGIN_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.LOGOUT_REQUEST] (state) {},

  [types.LOGOUT_SUCCESS] (state) {},

  [types.LOGOUT_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.UPDATE_ACCOUNT_REQUEST] (state) {},

  [types.UPDATE_ACCOUNT_SUCCESS] (state, { account }) {
    Vue.set(state, 'accountId', account.accountId)
    Vue.set(state, 'accountInfo', JSON.parse(account.jsonData))
    Vue.set(state, 'accountQuorum', account.quorum)
  },

  [types.UPDATE_ACCOUNT_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.GET_ACCOUNT_ASSET_TRANSACTIONS_REQUEST] (state) {},

  [types.GET_ACCOUNT_ASSET_TRANSACTIONS_SUCCESS] (state, { assetId, transactions }) {
    const txs = {
      ...transactions,
      loadedAmount: 200
    }
    Vue.set(state.assetTransactions, assetId, txs)
  },

  [types.GET_ACCOUNT_ASSET_TRANSACTIONS_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.GET_ACCOUNT_ASSET_TRANSACTIONS_NP_REQUEST] (state) {},

  [types.GET_ACCOUNT_ASSET_TRANSACTIONS_NP_SUCCESS] (state, { assetId, transactions }) {
    const txs = {
      allTransactionsSize: transactions.allTransactionsSize,
      nextTxHash: transactions.nextTxHash,
      loadedAmount: state.assetTransactions[assetId].loadedAmount + 200,
      transactionsList: [
        ...state.assetTransactions[assetId].transactionsList,
        ...transactions.transactionsList
      ]
    }
    Vue.set(state.assetTransactions, assetId, txs)
  },

  [types.GET_ACCOUNT_ASSET_TRANSACTIONS_NP_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.GET_ACCOUNT_ASSETS_REQUEST] (state) {},

  [types.GET_ACCOUNT_ASSETS_SUCCESS] (state, assets) {
    state.assets = assets
  },

  [types.GET_ACCOUNT_ASSETS_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.GET_ACCOUNT_TRANSACTIONS_REQUEST] (state) {},

  [types.GET_ACCOUNT_TRANSACTIONS_SUCCESS] (state, transactions) {
    state.rawTransactions = transactions
  },

  [types.GET_ACCOUNT_TRANSACTIONS_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.GET_ACCOUNT_SIGNATORIES_REQUEST] (state) {},

  [types.GET_ACCOUNT_SIGNATORIES_SUCCESS] (state, signatories) {
    state.accountSignatories = signatories
  },

  [types.GET_ACCOUNT_SIGNATORIES_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.GET_ALL_UNSIGNED_TRANSACTIONS_REQUEST] (state) {},

  [types.GET_ALL_UNSIGNED_TRANSACTIONS_SUCCESS] (state, transactions) {
    state.rawUnsignedTransactions = transactions
  },

  [types.GET_ALL_UNSIGNED_TRANSACTIONS_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.TRANSFER_ASSET_REQUEST] (state) {},

  [types.TRANSFER_ASSET_SUCCESS] (state) {},

  [types.TRANSFER_ASSET_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.SIGN_PENDING_REQUEST] (state) {},

  [types.SIGN_PENDING_SUCCESS] (state) {},

  [types.SIGN_PENDING_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.CREATE_SETTLEMENT_REQUEST] (state) {},

  [types.CREATE_SETTLEMENT_SUCCESS] (state) {},

  [types.CREATE_SETTLEMENT_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.ACCEPT_SETTLEMENT_REQUEST] (state) {
    state.acceptSettlementLoading = true
  },

  [types.ACCEPT_SETTLEMENT_SUCCESS] (state) {
    state.acceptSettlementLoading = false
  },

  [types.ACCEPT_SETTLEMENT_FAILURE] (state, err) {
    state.acceptSettlementLoading = false
    handleError(state, err)
  },

  [types.REJECT_SETTLEMENT_REQUEST] (state) {
    state.rejectSettlementLoading = true
  },

  [types.REJECT_SETTLEMENT_SUCCESS] (state) {
    state.rejectSettlementLoading = false
  },

  [types.REJECT_SETTLEMENT_FAILURE] (state, err) {
    state.rejectSettlementLoading = false
    handleError(state, err)
  },

  [types.GET_ALL_ASSET_TRANSACTIONS_REQUEST] (state) {},

  [types.GET_ALL_ASSET_TRANSACTIONS_SUCCESS] (state) {},

  [types.GET_ALL_ASSET_TRANSACTIONS_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.ADD_ACCOUNT_SIGNATORY_REQUEST] (state) {},

  [types.ADD_ACCOUNT_SIGNATORY_SUCCESS] (state, key) {
    if (state.accountInfo[getBrvsAccount(state.accountId)]) {
      const keys = state.accountInfo[getBrvsAccount(state.accountId)].user_keys
      const parsedKeys = JSON.parse(keys)
      Vue.set(
        state.accountInfo[getBrvsAccount(state.accountId)],
        'user_keys',
        // eslint-disable-next-line
        JSON.stringify([...parsedKeys, key].sort())
      )
    }
  },

  [types.ADD_ACCOUNT_SIGNATORY_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.REMOVE_ACCOUNT_SIGNATORY_REQUEST] (state) {},

  [types.REMOVE_ACCOUNT_SIGNATORY_SUCCESS] (state) {},

  [types.REMOVE_ACCOUNT_SIGNATORY_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.GET_ACCOUNT_QUORUM_REQUEST] (state) {},

  [types.GET_ACCOUNT_QUORUM_SUCCESS] (state, { quorum }) {
    state.accountQuorum = quorum
  },

  [types.GET_ACCOUNT_QUORUM_FAILURE] (state, err) {
    handleError(state, err)
  },

  [types.GET_BILLING_DATA_REQUEST] () {},

  [types.GET_BILLING_DATA_SUCCESS] (state, { response, asset, billingType }) {
    switch (billingType) {
      case BillingTypes.TRANSFER: {
        Vue.set(state.transferFee, asset, response.billing)
        break
      }
      case BillingTypes.WITHDRAWAL: {
        Vue.set(state.withdrawalFee, asset, response.billing)
        break
      }
      case BillingTypes.EXCHANGE: {
        Vue.set(state.exchangeFee, asset, response.billing)
        break
      }
      case BillingTypes.CUSTODY: {
        Vue.set(state.custodyFee, asset, response.billing)
        break
      }
      case BillingTypes.ACCOUNT_CREATION: {
        Vue.set(state.accountCreationFee, asset, response.billing)
        break
      }
    }
  },

  [types.GET_BILLING_DATA_FAILURE] () {},

  [types.CHECK_BRVS_REGISTRATION_REQUEST] (state) {},
  [types.CHECK_BRVS_REGISTRATION_SUCCESS] (state, registered) {
    state.brvsRegistration = registered
  },
  [types.CHECK_BRVS_REGISTRATION_FAILURE] (state) {},

  [types.GET_MASTER_CONTRACT_ADDRESS_REQUEST] (state) {},
  [types.GET_MASTER_CONTRACT_ADDRESS_SUCCESS] (state, { address }) {
    state.ethMasterContractAddress = address
  },
  [types.GET_MASTER_CONTRACT_ADDRESS_FAILURE] (state) {}
}

const actions = {
  setNotaryIp ({ commit }, { ip }) {
    commit(types.SET_NOTARY_IP, ip)
  },

  signup ({ commit }, { username }) {
    commit(types.SIGNUP_REQUEST)

    const { publicKey, privateKey } = irohaUtil.generateKeypair()

    return notaryUtil.signup(username, publicKey)
      .then(() => commit(types.SIGNUP_SUCCESS, { username, publicKey, privateKey }))
      .then(() => ({ username, privateKey }))
      .catch(err => {
        commit(types.SIGNUP_FAILURE, err)
        throw err
      })
  },

  signupWithKey ({ commit }, { username, publicKey }) {
    commit(types.SIGNUP_REQUEST)
    return notaryUtil.signup(username, publicKey)
      .then(() => commit(types.SIGNUP_SUCCESS))
      .catch(err => {
        commit(types.SIGNUP_FAILURE, err)
        throw err
      })
  },

  login ({ commit, dispatch }, { mnemonic, username, privateKey, nodeIp }) {
    commit(types.LOGIN_REQUEST)

    return irohaUtil.login(mnemonic, username, privateKey, nodeIp)
      .then(account => commit(types.LOGIN_SUCCESS, { account, privateKey }))
      .catch(err => {
        commit(types.LOGIN_FAILURE, err)
        throw err
      })
      .then(() => {
        dispatch('checkRegistrationBrvs')
      })
  },

  logout ({ commit, dispatch }) {
    commit(types.LOGOUT_REQUEST)

    return irohaUtil.logout()
      .then(() => {
        dispatch('resetAccountSession')
        commit(types.RESET)
        commit(types.LOGOUT_SUCCESS)
      })
      .catch(err => {
        commit(types.LOGOUT_FAILURE, err)
        throw err
      })
  },

  checkRegistrationBrvs ({ commit, getters, dispatch }) {
    commit(types.CHECK_BRVS_REGISTRATION_REQUEST)

    const brvsUrl = getters.servicesIPs['brvs-service'].value
    return brvsUtil.checkRegistrationBrvs(brvsUrl, getters.accountId)
      .then(({ registered }) => commit(types.CHECK_BRVS_REGISTRATION_SUCCESS, registered))
      .catch(err => {
        commit(types.CHECK_BRVS_REGISTRATION_FAILURE, err)
        throw err
      })
      .then(() => {
        dispatch('getAccountQuorum')
        dispatch('getSignatories')
      })
  },

  updateAccount ({ commit, state }) {
    commit(types.UPDATE_ACCOUNT_REQUEST)

    return irohaUtil.getAccount({
      accountId: state.accountId
    })
      .then((account) => {
        commit(types.UPDATE_ACCOUNT_SUCCESS, { account })
      })
      .catch(err => {
        commit(types.UPDATE_ACCOUNT_FAILURE, err)
        throw err
      })
  },

  getAccountAssetTransactions ({ commit, state }, { assetId }) {
    commit(types.GET_ACCOUNT_ASSET_TRANSACTIONS_REQUEST)

    return irohaUtil.getAccountAssetTransactions({
      accountId: state.accountId,
      assetId,
      pageSize: 200,
      firstTxHash: undefined
    })
      .then(responses => {
        commit(types.GET_ACCOUNT_ASSET_TRANSACTIONS_SUCCESS, {
          assetId: assetId,
          transactions: responses
        })
      })
      .catch(err => {
        commit(types.GET_ACCOUNT_ASSET_TRANSACTIONS_FAILURE, err)
        throw err
      })
  },

  getAccountAssetTransactionsNextPage ({ commit, state }, { page, assetId }) {
    const loadedAmount = state.assetTransactions[assetId].loadedAmount
    const hash = state.assetTransactions[assetId].nextTxHash

    if (loadedAmount < page * 10) {
      commit(types.GET_ACCOUNT_ASSET_TRANSACTIONS_NP_REQUEST)
      return irohaUtil.getAccountAssetTransactions({
        accountId: state.accountId,
        assetId,
        pageSize: 200,
        firstTxHash: hash.length ? hash : undefined
      })
        .then(responses => {
          commit(types.GET_ACCOUNT_ASSET_TRANSACTIONS_NP_SUCCESS, {
            assetId: assetId,
            transactions: responses
          })
        })
        .catch(err => {
          commit(types.GET_ACCOUNT_ASSET_TRANSACTIONS_NP_FAILURE, err)
          throw err
        })
    }
  },

  getAccountAssets ({ commit, state }) {
    commit(types.GET_ACCOUNT_ASSETS_REQUEST)

    return irohaUtil.getAccountAssets({
      accountId: state.accountId,
      pageSize: 100,
      firstAssetId: undefined
    })
      .then(assets => {
        commit(types.GET_ACCOUNT_ASSETS_SUCCESS, assets)
      })
      .catch(err => {
        commit(types.GET_ACCOUNT_ASSETS_FAILURE, err)
        throw err
      })
  },

  getAccountTransactions ({ commit, state }) {
    commit(types.GET_ACCOUNT_TRANSACTIONS_REQUEST)

    return irohaUtil.getAccountTransactions({
      accountId: state.accountId,
      pageSize: 100,
      firstTxHash: undefined
    })
      .then(transactions => {
        commit(types.GET_ACCOUNT_TRANSACTIONS_SUCCESS, transactions)
      })
      .catch(err => {
        commit(types.GET_ACCOUNT_TRANSACTIONS_FAILURE, err)
        throw err
      })
  },

  getAllUnsignedTransactions ({ commit }) {
    commit(types.GET_ALL_UNSIGNED_TRANSACTIONS_REQUEST)

    return irohaUtil.getRawPendingTransactions()
      .then(transactions => {
        commit(types.GET_ALL_UNSIGNED_TRANSACTIONS_SUCCESS, transactions)
      })
      .catch(err => {
        commit(types.GET_ALL_UNSIGNED_TRANSACTIONS_FAILURE, err)
        throw err
      })
  },

  getAllAssetsTransactions ({ commit, dispatch, state }) {
    commit(types.GET_ALL_ASSET_TRANSACTIONS_REQUEST)
    return new Promise(async (resolve, reject) => {
      for (const { assetId } of state.assets) {
        dispatch('getAccountAssetTransactions', { assetId })
          .catch(err => reject(err))
      }
      resolve()
    })
      .then(() => {
        commit(types.GET_ALL_ASSET_TRANSACTIONS_SUCCESS)
      })
      .catch((err) => {
        commit(types.GET_ALL_ASSET_TRANSACTIONS_FAILURE, err)
        throw err
      })
  },

  transferAsset ({ commit, state, getters }, { privateKeys, assetId, to, description = '', amount, fee, feeType }) {
    commit(types.TRANSFER_ASSET_REQUEST)
    return irohaUtil.transferAssetWithFee(privateKeys, getters.irohaQuorum, {
      srcAccountId: state.accountId,
      destAccountId: to,
      assetId,
      description,
      amount,
      fee,
      feeType
    })
      .then(() => {
        commit(types.TRANSFER_ASSET_SUCCESS)
      })
      .catch(err => {
        commit(types.TRANSFER_ASSET_FAILURE, err)
        throw err
      })
  },

  createTransferAssetTransaction ({ commit, state, getters }, { assetId, to, description = '', amount, fee, feeType }) {
    const transaction = irohaUtil.createTransferTransaction(getters.irohaQuorum, {
      srcAccountId: state.accountId,
      destAccountId: to,
      assetId,
      description,
      amount,
      fee,
      feeType
    })

    return transaction
  },

  createPendingTransaction ({ commit, state }, { txStoreId }) {
    let transaction = state.rawUnsignedTransactions.getTransactionsList()[txStoreId]
    const objectTransaction = transaction.toObject()

    if (objectTransaction.payload.batch) {
      const batch = findBatchFromRaw(state.rawUnsignedTransactions, objectTransaction.payload.batch)
      transaction = txHelper.createTxListFromArray(txHelper.addBatchMeta(batch, 0))
    }

    return transaction
  },

  createPendingTransactions ({ commit, state }) {
    const unsigned = cloneDeep(state.rawUnsignedTransactions)
    const transactions = unsigned.getTransactionsList()
    return transactions
      .map(tx => {
        const objectTransaction = tx.toObject()
        if (objectTransaction.payload.batch) {
          const batch = findBatchFromRaw(state.rawUnsignedTransactions, objectTransaction.payload.batch)
          return txHelper.createTxListFromArray(txHelper.addBatchMeta(batch, 0))
        }
        return tx
      })
  },

  signPendingTransaction ({ commit, state }, { privateKeys, txStoreId }) {
    commit(types.SIGN_PENDING_REQUEST)

    return irohaUtil.signPendingTransaction(privateKeys, state.rawUnsignedTransactions.getTransactionsList()[txStoreId])
      .then(() => {
        commit(types.SIGN_PENDING_SUCCESS)
      })
      .catch(err => {
        commit(types.SIGN_PENDING_FAILURE, err)
        throw err
      })
  },

  createAddSignatoryTransaction ({ state, getters }, publicKey) {
    const upperPublicKey = publicKey.toUpperCase()
    const transaction = irohaUtil.createAddSignatoryTransaction(getters.irohaQuorum, {
      accountId: state.accountId,
      publicKey: upperPublicKey
    })

    return transaction
  },

  createRemoveSignatoryTransaction ({ state, getters }, publicKey) {
    const transaction = irohaUtil.createRemoveSignatoryTransaction(getters.irohaQuorum, {
      accountId: state.accountId,
      publicKey
    })

    return transaction
  },

  addSignatory ({ commit, dispatch, state, getters }, privateKeys) {
    commit(types.ADD_ACCOUNT_SIGNATORY_REQUEST)

    const { privateKey, publicKey } = irohaUtil.generateKeypair()
    const upperPublicKey = publicKey.toUpperCase()
    return irohaUtil.addSignatory(privateKeys, getters.irohaQuorum, {
      accountId: state.accountId,
      publicKey: upperPublicKey
    })
      .then(() => {
        // Manual update, because BRVS is taking a lot of time to update account information
        commit(types.ADD_ACCOUNT_SIGNATORY_SUCCESS, upperPublicKey)
      })
      .then(() => ({ username: state.accountId, privateKey }))
      .catch(err => {
        commit(types.ADD_ACCOUNT_SIGNATORY_FAILURE, err)
        throw err
      })
  },

  removeSignatory ({ commit, dispatch, state, getters }, { privateKeys, publicKey }) {
    commit(types.REMOVE_ACCOUNT_SIGNATORY_REQUEST)
    return irohaUtil.removeSignatory(privateKeys, getters.irohaQuorum, {
      accountId: state.accountId,
      publicKey
    })
      .then(async () => {
        commit(types.REMOVE_ACCOUNT_SIGNATORY_SUCCESS)
        await dispatch('updateAccount')
      })
      .catch(err => {
        commit(types.REMOVE_ACCOUNT_SIGNATORY_FAILURE, err)
        throw err
      })
  },

  getSignatories ({ commit, state }) {
    commit(types.GET_ACCOUNT_SIGNATORIES_REQUEST)
    return irohaUtil.getSignatories({
      accountId: state.accountId
    })
      .then((keys) => {
        commit(types.GET_ACCOUNT_SIGNATORIES_SUCCESS, keys)
        return keys
      })
      .catch(err => {
        commit(types.GET_ACCOUNT_SIGNATORIES_FAILURE, err)
        throw err
      })
  },

  async getAccountQuorum ({ commit, getters }) {
    commit(types.GET_ACCOUNT_QUORUM_REQUEST)

    try {
      const dataCollectorUrl = getters.servicesIPs['data-collector-service'].value
      const { itIs } = await collectorUtil.getAccountQuorum(
        dataCollectorUrl,
        getters.accountId
      )
      commit(types.GET_ACCOUNT_QUORUM_SUCCESS, { quorum: itIs })
    } catch (err) {
      commit(types.GET_ACCOUNT_QUORUM_FAILURE, err)
      throw err
    }
  },

  getBillingData ({ commit, getters }, { domain, asset, billingType }) {
    commit(types.GET_BILLING_DATA_REQUEST)

    const dataCollectorUrl = getters.servicesIPs['data-collector-service'].value
    return billingUtil.getBillingData(dataCollectorUrl, domain, asset, billingType)
      .then(response => {
        commit(types.GET_BILLING_DATA_SUCCESS, { response, domain, asset, billingType })
      })
      .catch(err => {
        commit(types.GET_BILLING_DATA_FAILURE)
        throw err
      })
  },

  getMasterContractAddress ({ commit, getters }) {
    commit(types.GET_MASTER_CONTRACT_ADDRESS_REQUEST)

    const dataCollectorUrl = getters.servicesIPs['data-collector-service'].value
    return collectorUtil.getMasterContractAddress(dataCollectorUrl)
      .then(({ itIs: address }: { itIs: string }) => {
        commit(types.GET_MASTER_CONTRACT_ADDRESS_SUCCESS, { address })
      })
      .catch(err => {
        commit(types.GET_MASTER_CONTRACT_ADDRESS_FAILURE)
        throw err
      })
  }
}

export default {
  types,
  state,
  getters,
  mutations,
  actions
}
