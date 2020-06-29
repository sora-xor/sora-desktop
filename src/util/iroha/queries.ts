import { queries } from 'iroha-helpers'
import { newQueryServiceOptions } from './util'

const getAccount = ({
  accountId
}) => queries.getAccount(
  newQueryServiceOptions(), {
    accountId
  }
)

const getRawAccount = ({
  accountId
}) => queries.getRawAccount(
  newQueryServiceOptions(), {
    accountId
  }
)

const getAccountAssets = ({
  accountId,
  pageSize,
  firstAssetId
}) => queries.getAccountAssets(
  newQueryServiceOptions(), {
    accountId,
    pageSize,
    firstAssetId
  }
)

const getAccountDetail = ({
  accountId,
  key,
  writerId,
  pageSize,
  paginationKey,
  paginationWriter
}) => queries.getAccountDetail(
  newQueryServiceOptions(), {
    accountId,
    key,
    writerId,
    pageSize,
    paginationKey,
    paginationWriter
  }
)

const getAccountTransactions = ({
  accountId,
  pageSize,
  firstTxHash
}) => queries.getAccountTransactions(
  newQueryServiceOptions(), {
    accountId,
    pageSize,
    firstTxHash
  }
)

const getAccountAssetTransactions = ({
  accountId,
  assetId,
  pageSize,
  firstTxHash
}) => queries.getAccountAssetTransactions(
  newQueryServiceOptions(), {
    accountId,
    assetId,
    pageSize,
    firstTxHash
  }
)

const getSignatories = ({
  accountId
}) => queries.getSignatories(
  newQueryServiceOptions(), {
    accountId
  }
)

const getTransactions = ({
  txHashes
}) => queries.getTransactions(
  newQueryServiceOptions(), {
    transactionsHashes: txHashes
  }
)

const getBlock = ({
  height
}) => queries.getBlock(
  newQueryServiceOptions(), {
    height
  }
)

const getRawPendingTransactions = () => queries.getRawPendingTransactions(
  newQueryServiceOptions()
)

const getAssetInfo = ({
  assetId
}) => queries.getAssetInfo(
  newQueryServiceOptions(), {
    assetId
  }
)

export {
  getAccount,
  getRawAccount,
  getAccountAssets,
  getAccountAssetTransactions,
  getAccountTransactions,
  getAccountDetail,
  getSignatories,
  getTransactions,
  getBlock,
  getRawPendingTransactions,
  getAssetInfo
}
