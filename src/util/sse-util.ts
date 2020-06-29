import axios from 'axios'
import configUtil from '@/util/config-util'

const PROTOCOL = configUtil.getUrlProtocol

const getPreviousProofs = ({ baseURL, accountId }) => {
  return axios({
    baseURL: `${PROTOCOL}//${baseURL}`,
    url: `/notification/find/withdrawalProofs/${accountId}`
  })
    .then(({ data }) => data)
    .catch(err => console.error(err))
}

export default {
  getPreviousProofs
}
