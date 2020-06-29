import map from 'lodash/fp/map'
import flatMap from 'lodash/fp/flatMap'
import concat from 'lodash/fp/concat'
import fromPairs from 'lodash/fp/fromPairs'
import flow from 'lodash/fp/flow'
import sseUtil from '@/util/sse-util'

const types = flow(
  flatMap(x => [x + '_REQUEST', x + '_SUCCESS', x + '_FAILURE']),
  concat([
    'RESET'
  ]),
  map(x => [x, x]),
  fromPairs
)([
  'GET_PREVIOUS_PROOFS'
])

function initialState () {
  return {}
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

  [types.GET_PREVIOUS_PROOFS_REQUEST] () {},
  [types.GET_PREVIOUS_PROOFS_SUCCESS] () {},
  [types.GET_PREVIOUS_PROOFS_FAILURE] () {}
}

const actions = {
  async getPreviousProofs ({ commit, getters }) {
    commit(types.GET_PREVIOUS_PROOFS_REQUEST)
    const SSE_URL = getters.servicesIPs['sse-service'].value
    try {
      const proofs = await sseUtil.getPreviousProofs({
        baseURL: SSE_URL,
        accountId: getters.accountId
      })
      commit(types.GET_PREVIOUS_PROOFS_SUCCESS)
      return proofs
    } catch (error) {
      commit(types.GET_PREVIOUS_PROOFS_FAILURE)
      throw error
    }
  }
}

export default {
  types,
  state,
  getters,
  mutations,
  actions
}
