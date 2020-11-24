import {
  commands,
  signWithArrayOfKeys,
  sendTransactions,
  txHelper
} from 'iroha-helpers'
import Transaction from 'iroha-helpers/lib/proto/transaction_pb'
import TxList from 'iroha-helpers/lib/proto/endpoint_pb'
import {
  newCommandService,
  newCommandServiceOptions
} from './util'
import cloneDeep from 'lodash/fp/cloneDeep'
import { FeeTypes } from '@/data/consts'

const DEFAULT_TIMEOUT_LIMIT = 5000

// /**
//  * signPendingTransaction: sign transaction with more keys and send.
//  * @param {Array.<String>} privateKeys
//  * @param {Object} transaction
//  */
function signPendingTransaction (privateKeys = [], transaction, timeoutLimit = DEFAULT_TIMEOUT_LIMIT) {
  /*
    * TODO: Remove clearSignaturesList() after
    * https://soramitsu.atlassian.net/browse/IR-1680 is completed
    * Now we should remove signatures because otherwise the transaction
    * won't get to MST processor and will be immediately commited
  */
  let txToSend = cloneDeep(transaction)
  txToSend.clearSignaturesList()

  txToSend = signWithArrayOfKeys(txToSend, privateKeys)

  const txClient = newCommandService()

  return sendTransactions([txToSend], txClient, timeoutLimit, [
    'COMMITTED'
  ])
}

function sendBinaryTransaction (bytes, timeoutLimit = DEFAULT_TIMEOUT_LIMIT) {
  const txClient = newCommandService()
  let tx
  try {
    tx = [Transaction.Transaction.deserializeBinary(bytes)]
  } catch (error) {
    tx = TxList.TxList.deserializeBinary(bytes).getTransactionsList()
  }
  return sendTransactions(tx, txClient, timeoutLimit, [
    'COMMITTED',
    'MST_PENDING'
  ])
}

const createAccount = (privateKeys, quorum, {
  accountName,
  domainId,
  publicKey
}) => commands.createAccount(
  newCommandServiceOptions(privateKeys, quorum), {
    accountName,
    domainId,
    publicKey
  }
)

const createAsset = (privateKeys, quorum, {
  assetName,
  domainId,
  precision
}) => commands.createAsset(
  newCommandServiceOptions(privateKeys, quorum), {
    assetName,
    domainId,
    precision
  }
)

const transferAsset = (privateKeys, quorum, {
  srcAccountId,
  destAccountId,
  assetId,
  description,
  amount
}) => commands.transferAsset(
  newCommandServiceOptions(privateKeys, quorum), {
    srcAccountId,
    destAccountId,
    assetId,
    description,
    amount
  }
)

const createTransferTransaction = (quorum, {
  srcAccountId,
  destAccountId,
  assetId,
  description,
  amount,
  fee,
  feeType
}) => {
  const feeAmount = String(fee)
  let tx = txHelper.addCommand(
    txHelper.emptyTransaction(),
    'transferAsset',
    { srcAccountId, destAccountId, assetId, description, amount }
  )

  if (fee > 0) {
    if (feeType === FeeTypes.EXCHANGE) {
      tx = txHelper.addCommand(
        tx,
        'subtractAssetQuantity',
        { assetId: 'val#sora', amount: feeAmount }
      )
    } else {
      tx = txHelper.addCommand(
        tx,
        'subtractAssetQuantity',
        { assetId, amount: feeAmount }
      )
    }
  }

  return txHelper.addMeta(tx, { creatorAccountId: srcAccountId, quorum })
}

const transferAssetWithFee = (privateKeys, quorum, {
  srcAccountId,
  destAccountId,
  assetId,
  description,
  amount,
  fee,
  feeType,
  timeoutLimit = DEFAULT_TIMEOUT_LIMIT
}) => {
  const txClient = newCommandService()

  let senderTx = createTransferTransaction(quorum, { srcAccountId, destAccountId, assetId, description, amount, fee, feeType })
  senderTx = signWithArrayOfKeys(senderTx, privateKeys)

  return sendTransactions([senderTx], txClient, timeoutLimit, [
    'COMMITTED',
    'COMMITTED'
  ])
}

const createAddSignatoryTransaction = (quorum, { accountId, publicKey }) => {
  const tx = txHelper.addCommand(
    txHelper.emptyTransaction(),
    'addSignatory',
    {
      accountId,
      publicKey
    }
  )

  return txHelper.addMeta(tx, {
    creatorAccountId: accountId,
    quorum
  })
}

const createRemoveSignatoryTransaction = (quorum, { accountId, publicKey }) => {
  const tx = txHelper.addCommand(
    txHelper.emptyTransaction(),
    'removeSignatory',
    {
      accountId,
      publicKey
    }
  )

  return txHelper.addMeta(tx, {
    creatorAccountId: accountId,
    quorum
  })
}

const addSignatory = (privateKeys, quorum, {
  accountId,
  publicKey
}) => commands.addSignatory(
  newCommandServiceOptions(privateKeys, quorum), {
    accountId,
    publicKey
  }
)

const removeSignatory = (privateKeys, quorum, {
  accountId,
  publicKey
}) => commands.removeSignatory(
  newCommandServiceOptions(privateKeys, quorum), {
    accountId,
    publicKey
  }
)

const addAssetQuantity = (privateKeys, quorum, {
  assetId,
  amount
}) => commands.addAssetQuantity(
  newCommandServiceOptions(privateKeys, quorum), {
    assetId,
    amount
  }
)

const setAccountDetail = (privateKeys, quorum, {
  accountId,
  key,
  value
}) => commands.setAccountDetail(
  newCommandServiceOptions(privateKeys, quorum), {
    accountId,
    key,
    value
  }
)

const createSetAccountDetailTransaction = (quorum, {
  accountId,
  key,
  value
}) => {
  const tx = txHelper.addCommand(
    txHelper.emptyTransaction(),
    'setAccountDetail',
    {
      accountId,
      key,
      value
    }
  )

  return txHelper.addMeta(tx, {
    creatorAccountId: accountId,
    quorum
  })
}

const setAccountQuorum = (privateKeys, currentQuorum, {
  accountId,
  quorum
}) => commands.setAccountQuorum(
  newCommandServiceOptions(privateKeys, currentQuorum), {
    accountId,
    quorum
  }
)

export {
  createAccount,
  createAsset,
  transferAsset,
  createTransferTransaction,
  transferAssetWithFee,
  addSignatory,
  createAddSignatoryTransaction,
  removeSignatory,
  createRemoveSignatoryTransaction,
  addAssetQuantity,
  setAccountDetail,
  createSetAccountDetailTransaction,
  setAccountQuorum,
  sendBinaryTransaction,
  signPendingTransaction
}
