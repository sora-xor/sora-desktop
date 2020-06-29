import axios from 'axios'
import querystring from 'querystring'
import configUtil from '@/util/config-util'

const PROTOCOL = configUtil.getUrlProtocol

const checkAccountExists = (url, accountId) => {
  const formattedString = querystring.stringify({ accountId })

  return axios({
    url: `/iroha/account/exists?${formattedString}`,
    baseURL: `${PROTOCOL}//${url}`
  })
    .then(({ data }) => data)
    .catch(err => err)
}

const getAccountQuorum = (url, accountId) => {
  const formattedString = querystring.stringify({ accountId })

  return axios({
    url: `/iroha/account/quorum?${formattedString}`,
    baseURL: `${PROTOCOL}//${url}`
  })
    .then(({ data }) => data)
    .catch(err => err)
}

const getAssetPrecision = (url, assetId) => {
  // encodeURIComponent used for escape # character in assedId
  const encodedAssetId = encodeURIComponent(assetId)
  return axios({
    url: `/iroha/asset/precision/${encodedAssetId}`,
    baseURL: `${PROTOCOL}//${url}`
  })
    .then(({ data }) => data)
    .catch(err => err)
}

const getMasterContractAddress = (url) => {
  return axios({
    url: '/iroha/eth/masterContract',
    baseURL: `${PROTOCOL}//${url}`
  })
    .then(({ data }) => data)
    .catch(err => err)
}

const getAssetRates = (url, { assets, base, precision }) => {
  const encodedAssets = assets
    .reduce(
      (prev, next) => (prev += `assets=${encodeURIComponent(next)}&`),
      ''
    )
  const encodedBase = `${encodeURIComponent(base)}`
  return axios({
    url: `/v1/rates?${encodedAssets}base=${encodedBase}&precision=${precision}`,
    baseURL: `${PROTOCOL}//${url}`
  })
    .then(({ data }) => data)
    .catch(err => err)
}

export default {
  checkAccountExists,
  getAccountQuorum,
  getAssetPrecision,
  getMasterContractAddress,
  getAssetRates
}
