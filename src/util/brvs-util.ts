import axios from 'axios'
import configUtil from '@/util/config-util'

const PROTOCOL = configUtil.getUrlProtocol

const checkRegistrationBrvs = (url, accountId) => {
  return axios.post(`${PROTOCOL}//${url}/brvs/rest/v1/isRegistered`, {
    accountId
  })
    .then(({ data }) => data)
    .catch(err => err)
}

export default {
  checkRegistrationBrvs
}
