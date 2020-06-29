import { cryptoHelper } from 'iroha-helpers'
import { getAccount } from './queries'
import { cache, clearCache, setCache } from './util'
import { getItem, setItem } from '@/util/storage/local'
import Debug from 'debug'
const debug = Debug('iroha-util')

/**
 * login
 * @param {String} username
 * @param {String} privateKey length is 64
 * @param {String} nodeIp
 */
function login (mnemonic, username, privateKey, nodeIp) {
  debug('starting login...')

  if (privateKey.length !== 64) {
    return Promise.reject(new Error('privateKey should have length of 64'))
  }

  setCache(mnemonic, username, privateKey, nodeIp)

  return getAccount({
    accountId: username
  })
    .then(account => {
      debug('login succeeded!')
      return account
    })
    .catch(err => {
      debug('login failed')
      clearCache()
      throw err
    })
}

function logout () {
  clearCache()
  return Promise.resolve()
}

function isLoggedIn () {
  return !!cache.username
}

// generate new keypair
const generateKeypair = cryptoHelper.generateKeyPair

export {
  login,
  logout,
  isLoggedIn,
  generateKeypair
}
