import { Vue, Component } from 'vue-property-decorator'

import { derivePublicKey } from 'ed25519.js'
import gt from 'lodash/fp/gt'
import lte from 'lodash/fp/lte'
import BigNumber from 'bignumber.js'
import { SearchTypes } from '@/data/consts'

import collectorUtil from '@/util/collector-util'
import mnemonicUtil from '@/util/mnemonic-util'

const getPrecision = (v) => (v.split('.')[1] || []).length

const errorMessages = {
  _userName: 'Username should match [a-z_0-9]{1,32}',
  _userDomain: 'Username should match [a-z_0-9]{1,32}@[a-z_0-9]{1,9}',
  _userNotExist: 'This username does not exist',
  _userExist: 'This username already exist',
  _userIsMe: 'Username should not be same as your username',

  _keyPattern: 'Please provide correct key',
  _keyEqualsTo: 'Please provide private key related to your account',
  _keyDuplication: 'You can\'t use this private key twice',
  _isSignedWithKey: 'You already sign transaction with this private key',
  _nodeIp: 'Please provide correct IP address',

  _address: 'Please provide correct address',
  _ethAddress: 'Please provide correct ETH address',

  _asset: 'Please select asset',
  _amount: 'Please provide correct amount',
  _fee: 'Not enough VAL to pay the fee',

  _explorerQuery: 'Query is incorrect',

  _required: 'This field is required',

  _mnemonic: 'Invalid mnemonic phrase',

  _passwordLength: 'Password must have at least 8 characters',
  _passwordLatin: 'Password must have only latin letters and numbers',
  _passwordAtLeastOneUpper: 'Minimum of 1 upper case letter',
  _passwordAtLeastOneLower: 'Minimum of 1 lower case letter',
  _passwordAtLeastOneDigit: 'Minimum of 1 numeric character',
  _sameAsPassword: 'Passwords must be identical'
}

/**
 * If validation function returns false it means that field is not valid
 * else field is valid
 */

export const _mnemonic = (value) => {
  return mnemonicUtil.validate(value)
}

export const _password = {
  allowedSymbols: (v: string) => /^[A-Za-z0-9]+$/.test(v),
  atLeastLength: (v: string) => v?.length >= 8,
  atLeastOneUpper: (v: string) => /(?=.*?[A-Z])/.test(v),
  atLeastOneLower: (v: string) => /(?=.*?[a-z])/.test(v),
  atLeastOneDigit: (v: string) => /(?=.*?[0-9])/.test(v)
}

export const _keyPattern = (value) => {
  const pattern = /^[A-Fa-f0-9]{64}$/
  if (value.length === 0) return true
  if (!pattern.test(value)) return false
  return true
}

export const _isSignedWithKey = (keys) => (value) => {
  let publicKey
  try {
    publicKey = derivePublicKey(Buffer.from(value, 'hex')).toString('hex')
  } catch (error) {
    console.error('Error: Invalid private key')
    return false
  }
  if (keys.includes(publicKey)) {
    return false
  }
  return true
}

export const _keyEqualsTo = (publicKeys) => (value) => {
  if (!value.length) return true

  const allPublicKeys = new Set(publicKeys)
  let publicKey
  try {
    publicKey = derivePublicKey(Buffer.from(value, 'hex')).toString('hex')
  } catch (error) {
    console.error('Error: Invalid private key')
    return false
  }

  return allPublicKeys.has(publicKey.toUpperCase())
}

export const _keyDuplication = (keys) => {
  const privateKeys = keys.map(({ hex }) => hex)
  return new Set(privateKeys).size === privateKeys.length
}

export const _nodeIp = (url) => {
  let tempAddress = url.slice()
  if (url.includes('http://')) tempAddress = tempAddress.substr(7)
  if (url.includes('https://')) tempAddress = tempAddress.substr(8)
  const validateAddress = /^([a-z0-9\-.]*)\.(([a-z]{2,4})|([0-9]{1,3}\.([0-9]{1,3})\.([0-9]{1,3})))|(:[0-9]{1,5})$/.test(tempAddress)
  if (!validateAddress) return false
  return true
}

export const _user = {
  name: (name) => {
    const pattern = /^[a-z_0-9]{1,32}$/
    if (!pattern.test(name)) return false
    return true
  },
  nameDomain: (name) => {
    const pattern = /^[a-z_0-9]{1,32}@[a-z_0-9]{1,9}$/
    if (!pattern.test(name)) return false
    return true
  },
  nameExist: (url) => debounceAsyncValidator((name, debounce) => {
    if (!_user.nameDomain(name)) return Promise.resolve(false)

    return debounce()
      .then(() => collectorUtil.checkAccountExists(url.value, name))
      .then(res => res.itIs)
      .catch(() => {})
    // return true
  }, 500),
  isMe: (accountId) => (name) => {
    return !(accountId === name)
  }
}

export const _wallet = {
  ethAddress: (address) => /^0x[a-fA-F0-9]{40}$/.test(address),
  address: (address) => {
    const validateETH = _wallet.ethAddress(address)
    if (!validateETH) return false
    return true
  },
  asset: (asset) => (amount) => {
    if (!asset) return false
    return true
  }
}

export const _fee = (wallet) => (_) => {
  if (new BigNumber(wallet.amount).lt(new BigNumber(wallet.fee))) return false
  return true
}

export const _amount = (wallet) => (amount) => {
  const fee = Number(wallet.fee) || 0
  if (isNaN(Number(amount))) return false
  if (!/^(?![0.]+$)\d+(\.\d+)?$/.test(amount)) return false
  if (amount !== null && gt(getPrecision(amount))(wallet.precision)) return false
  if (amount !== null && amount.length === 0) return false
  if (wallet.feeType === 'FRACTION') {
    if (
      new BigNumber(amount)
        .gt(
          new BigNumber(wallet.amount)
            .minus(
              new BigNumber(fee)
                .multipliedBy(amount)
            )
        )
    ) return false
  } else {
    if (
      new BigNumber(amount)
        .gt(
          new BigNumber(wallet.amount)
            .minus(
              new BigNumber(fee)
            )
        )
    ) return false
  }
  if (lte(Number(amount))(0)) return false
  return true
}

export const _explorerQuery = (type) => (query) => {
  if (type === SearchTypes.ACCOUNT) {
    return _user.nameDomain(query)
  } else if (type === SearchTypes.BLOCK) {
    return Number.isInteger(Number(query))
  } else if (type === SearchTypes.TRANSACTION) {
    return true
  }
  return true
}

@Component
export class ErrorHandler extends Vue {
  _isValid (f, key) {
    if (!f || !f.$model) return
    if (key) return f.$dirty && f.$model[key].length && !f.$error
    return f.$dirty && f.$model.length && !f.$error
  }
  _isError (model) {
    return model.$error
  }
  _showError (model) {
    const fields = Object.keys(model).filter(k => k.includes('_') && !model[k])
    if (fields.length) return errorMessages[fields[0]]
    if (!model.required) return errorMessages['_required']
  }
}

// This is the wrapper function: validator is the actual validation function, and delay is in milliseconds.
// Note that the validator function accepts two parameters: the value and a debounce function to wrap
// the asynchronous validation.
// https://github.com/vuelidate/vuelidate/issues/242#issuecomment-428558197
function debounceAsyncValidator (validator, delay) {
  let currentTimer: number | undefined
  let currentPromiseReject: Function | null = null

  function debounce () {
    return new Promise((resolve, reject) => {
      currentTimer = window.setTimeout(() => {
        currentTimer = undefined
        currentPromiseReject = null
        resolve()
      }, delay)
      currentPromiseReject = reject
    })
  }

  return function (this: any, value) {
    if (currentTimer && currentPromiseReject) {
      currentPromiseReject(new Error('replaced'))
      clearTimeout(currentTimer)
      currentTimer = undefined
    }

    return validator.call(this, value, debounce)
  }
}
