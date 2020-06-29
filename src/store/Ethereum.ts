import Vue from 'vue'
import map from 'lodash/fp/map'
import flatMap from 'lodash/fp/flatMap'
import concat from 'lodash/fp/concat'
import fromPairs from 'lodash/fp/fromPairs'
import flow from 'lodash/fp/flow'
import { createWeb3Provider, readSmartContract, getInfoFromContract, executeContractMethod } from '@/util/web3-util'

const types = flow(
  flatMap(x => [x + '_REQUEST', x + '_SUCCESS', x + '_FAILURE']),
  concat([
    'RESET',
    'ETHEREUM_DIALOG_OPEN',
    'ETHEREUM_DIALOG_CLOSE'
  ]),
  map(x => [x, x]),
  fromPairs
)([
  'EXECUTE_CONTRACT',
  'CHECK_CONTRACT'
])

function initialState () {
  return {
    ethereumDialog: {
      isVisible: false,
      proof: {},
      resolvePrompting: null,
      rejectPrompting: null
    }
  }
}

const state = initialState()

const getters = {}

const mutations = {
  [types.RESET] (state) {
    const s = initialState()
    Object.keys(s).forEach(key => {
      state[key] = s[key]
    })
  },

  [types.EXECUTE_CONTRACT_REQUEST] () {},
  [types.EXECUTE_CONTRACT_SUCCESS] () {},
  [types.EXECUTE_CONTRACT_FAILURE] () {},

  [types.CHECK_CONTRACT_REQUEST] () {},
  [types.CHECK_CONTRACT_SUCCESS] () {},
  [types.CHECK_CONTRACT_FAILURE] () {},

  [types.ETHEREUM_DIALOG_OPEN] (state, { resolvePrompting, rejectPrompting, proof }) {
    Vue.set(state, 'ethereumDialog', {
      isVisible: true,
      resolvePrompting,
      rejectPrompting,
      proof
    })
  },
  [types.ETHEREUM_DIALOG_CLOSE] (state, privateKeys) {
    Vue.set(state.ethereumDialog, 'isVisible', false)
    Vue.set(state.ethereumDialog, 'proof', {})
    state.ethereumDialog.resolvePrompting(privateKeys)
  }
}

const actions = {
  async executeEthereumContract ({ commit, getters }, {
    privateKey,
    tokenAddress,
    amount,
    to,
    txHash,
    v,
    r,
    s
  }) {
    commit(types.EXECUTE_CONTRACT_REQUEST)
    let NODE_URL = getters.servicesIPs['eth-node-service'].value
    if ((window as any).useEthLocalNode) {
      NODE_URL = 'ropsten.infura.io/v3/84945134e05a4aada4ea9002f8d9cb97'
    }

    try {
      const web3 = createWeb3Provider(NODE_URL)
      const contract = await readSmartContract('Master.json')
      const info = getInfoFromContract(contract)
      const contractAddress = getters.ethMasterContractAddress

      const method = tokenAddress === '0x0000000000000000000000000000000000000000'
        ? 'withdraw'
        : 'mintTokensByPeers'

      const execResult = await executeContractMethod({
        web3,
        contractInfo: info,
        contractAddress,
        method,
        methodArgs: [
          tokenAddress,
          web3.utils.toBN(amount).toString(),
          to,
          `0x${txHash}`,
          v,
          r,
          s,
          to
        ],
        accountPrivate: privateKey,
        accountAddress: web3.eth.accounts.privateKeyToAccount(privateKey).address
      })
      commit(types.EXECUTE_CONTRACT_SUCCESS)
      return execResult
    } catch (error) {
      console.error(error)
      commit(types.EXECUTE_CONTRACT_FAILURE)
      throw error
    }
  },

  openEthereumApprovalDialog ({ commit }, { proof = {} } = {}) {
    let resolvePrompting, rejectPrompting
    const prompting = new Promise((resolve, reject) => {
      resolvePrompting = resolve
      rejectPrompting = reject
    })

    commit(types.ETHEREUM_DIALOG_OPEN, {
      resolvePrompting,
      rejectPrompting,
      proof
    })

    return prompting
  },
  closeEthreumApprovalDialog ({ commit }, privateKeys) {
    commit(types.ETHEREUM_DIALOG_CLOSE, privateKeys)
  }
}

export default {
  types,
  state,
  getters,
  mutations,
  actions
}
