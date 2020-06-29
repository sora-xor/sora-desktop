import axios from 'axios'
import configUtil from '@/util/config-util'

const PROTOCOL = configUtil.getUrlProtocol

const axiosNotaryRegistration = axios.create({
  baseURL: ''
})

const signup = axios => (username, publicKey) => {
  const [name, domain] = username.split('@')
  const postData = new FormData()

  postData.append('name', name)
  postData.append('pubkey', publicKey)
  postData.append('domain', domain)

  return axios
    .post('users', postData)
    .then(({ data }) => ({ response: data }))
}

export default {
  get baseURL () { return axiosNotaryRegistration.defaults.baseURL },
  set baseURL (baseURL) {
    axiosNotaryRegistration.defaults.baseURL = `${PROTOCOL}//${baseURL}`
  },
  signup: signup(axiosNotaryRegistration)
}
