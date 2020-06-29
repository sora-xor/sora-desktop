import isEmpty from 'lodash/fp/isEmpty'
import isEqual from 'lodash/fp/isEqual'
import chunk from 'lodash/fp/chunk'
import cloneDeep from 'lodash/fp/cloneDeep'
import { NOTARY_ACCOUNT, EXCHANGE_ACCOUNT } from '@/data/consts'

export function getFormatedCommandsFrom (transactions, accountId, financeOnly = false) {
  if (!transactions.length) return []

  const _formatTransferAsset = ({ amount, destAccountId, srcAccountId, description, assetId }) => {
    if (
      (destAccountId !== accountId) &&
      (srcAccountId !== accountId)
    ) return

    let type = 'TRANSFER'
    let sign = '+'

    const from = match(srcAccountId)
      .on(x => x === accountId, () => {
        sign = '-'
        type = 'SEND'
        return 'you'
      })
      .on(x => x === NOTARY_ACCOUNT, () => {
        type = 'DEPOSIT'
        return 'System'
      })
      .on(x => x === EXCHANGE_ACCOUNT, () => {
        type = 'EXCHANGE'
        return 'System'
      })
      .otherwise(x => x)
    const to = match(destAccountId)
      .on(x => x === accountId, () => {
        type = 'RECEIVE'
        return 'you'
      })
      .on(x => x === NOTARY_ACCOUNT, () => {
        type = 'WITHDRAWAL'
        return 'System'
      })
      .on(x => x === EXCHANGE_ACCOUNT, () => {
        type = 'EXCHANGE'
        return 'System'
      })
      .otherwise(x => {
        return x
      })

    return {
      transferAsset: {
        from,
        to,
        type,
        sign,
        amount,
        message: description,
        assetId
      }
    }
  }
  const _formatAddAssetQuantity = ({ assetId, amount }) => {
    return {
      addAssetQuantity: {
        assetId,
        amount,
        sign: '+',
        type: 'ADD ASSET'
      }
    }
  }
  const _formatSubtractAssetQuantity = ({ assetId, amount }) => {
    return {
      subtractAssetQuantity: {
        assetId,
        amount,
        sign: '-',
        type: 'SUBTRACT ASSET'
      }
    }
  }
  const _formatSetAccountDetail = ({ accountId, key, value }) => {
    return {
      setAccountDetail: {
        accountId,
        key,
        value,
        type: 'ACCOUNT UPDATE'
      }
    }
  }
  const _formatAddSignatory = ({ publicKey }) => {
    return {
      addSignatory: {
        publicKey,
        type: 'ADD SIGNATORY'
      }
    }
  }
  const _formatRemoveSignatory = ({ publicKey }) => {
    return {
      removeSignatory: {
        publicKey,
        type: 'REMOVE SIGNATORY'
      }
    }
  }

  const format = transactions.map((t, id) => {
    const { commandsList, creatorAccountId } = t.payload.reducedPayload
    const isMyTransaction = creatorAccountId === accountId
    const format = commandsList
      .map(c => {
        if (c.transferAsset) return _formatTransferAsset(c.transferAsset)
        if (c.addAssetQuantity && isMyTransaction) return _formatAddAssetQuantity(c.addAssetQuantity)
        if (c.subtractAssetQuantity && isMyTransaction) return _formatSubtractAssetQuantity(c.subtractAssetQuantity)
        if (!financeOnly) {
          if (c.addSignatory) return _formatAddSignatory(c.addSignatory)
          if (c.removeSignatory) return _formatRemoveSignatory(c.removeSignatory)
          if (c.setAccountDetail) return _formatSetAccountDetail(c.setAccountDetail)
        }
      })
      .filter(Boolean)

    return {
      ...t,
      id,
      payload: {
        ...t.payload,
        reducedPayload: {
          ...t.payload.reducedPayload,
          commandsList: format
        }
      }
    }
  })

  return format
}

function getSettlementsRawPair (transactions) {
  if (isEmpty(transactions)) return []
  // convert elements to pairs by two elements in pair
  const settlements = chunk(2)(transactions.getTransactionsList())
  return settlements
}

export function findBatchFromRaw (rawUnsignedTransactions, settlement) {
  const rawUnsignedTransactionsCopy = cloneDeep(rawUnsignedTransactions)
  const rawPairs = getSettlementsRawPair(rawUnsignedTransactionsCopy)
  const batch = rawPairs.find((tr: any) => {
    return isEqual(tr[0].toObject().payload.batch, settlement) || isEqual(tr[1].toObject().payload.batch, settlement)
  }) || []
  return batch
}

// Match function https://codeburst.io/alternative-to-javascripts-switch-statement-with-a-functional-twist-3f572787ba1c
const matched = x => ({
  on: () => matched(x),
  otherwise: () => x
})

const match = x => ({
  on: (pred, fn) => (pred(x) ? matched(fn(x)) : match(x)),
  otherwise: fn => fn(x)
})
