export const WalletTypes = Object.freeze({
  ETH: Symbol('ETH')
})

export const SearchTypes = Object.freeze({
  BLOCK: 'Block',
  TRANSACTION: 'Transaction',
  ACCOUNT: 'Account'
})

export const FeeTypes = Object.freeze({
  TRANSFER: 'transfer_billing',
  CUSTODY: 'custody_billing',
  ACCOUNT_CREATION: 'account_creation_billing',
  EXCHANGE: 'exchange_billing',
  WITHDRAWAL: 'withdrawal_billing'
})

export const BillingTypes = Object.freeze({
  TRANSFER: 'TRANSFER',
  CUSTODY: 'CUSTODY',
  ACCOUNT_CREATION: 'ACCOUNT_CREATION',
  EXCHANGE: 'EXCHANGE',
  WITHDRAWAL: 'WITHDRAWAL'

})

export const NOTARY_ACCOUNT = 'notary@notary'
export const EXCHANGE_ACCOUNT = 'exchanger_fiat@notary'
