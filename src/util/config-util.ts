import axios from 'axios'

// const getUrlProtocol = location.protocol
const getUrlProtocol = 'https:'

const getConfiguration = () => {
  return axios
    .get('/config.json')
    .then(({ data }) => data)
    .catch(err => console.error(err))
}

export default {
  getUrlProtocol,
  getConfiguration
}
