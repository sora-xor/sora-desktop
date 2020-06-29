<template>
  <div class="history-table">
    <div class="history-table_header">
      <div class="history-table_header-title">
        <span>History</span>
        <el-button
          size="medium"
          type="primary"
          @click="$emit('update-history')"
        >
          Refresh
        </el-button>
      </div>
    </div>
    <el-table
      ref="table"
      :data="transactions"
      class="wallets_table"
      @row-dblclick="(row) => this.$refs.table.toggleRowExpansion(row)"
    >
      <el-table-column
        type="expand"
      >
        <template slot-scope="scope">
          <history-table-item
            :commands="scope.row.payload.reducedPayload.commandsList"
            :asset="assetName(wallet.assetId)"
          />
        </template>
      </el-table-column>
      <el-table-column
        width="130"
        align="center"
      >
        <template slot-scope="scope">
          <div
            class="wallets_table-type"
            :set="type = getType(scope.row.payload.reducedPayload.commandsList)"
          >
            <img
              :class="[
                'wallets_table-type-icon',
                `blue_arrow ${type.icon}`
              ]"
              src="@/assets/wallet/blue-arrow.svg"
            >
            <span>{{ type.label }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        label="Date"
        align="center"
      >
        <template slot-scope="scope">
          <span>
            {{ formatDate(scope.row.payload.reducedPayload.createdTime) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column
        label="Amount"
        align="center"
        show-overflow-tooltip
      >
        <template
          slot-scope="scope"
        >
          <div
            :set="amount = calcTotalAmount(scope.row.payload.reducedPayload.commandsList)"
          >
            {{ amount }} {{ assetName(wallet.assetId) }}
          </div>
        </template>
      </el-table-column>
      <el-table-column
        label="Description"
        header-align="center"
      >
        <template slot-scope="scope">
          <el-tooltip
            effect="dark"
            placement="top"
            :visible-arrow="false"
            :set="msg = getFirstDescription(scope.row.payload.reducedPayload.commandsList)"
          >
            <div slot="content">
              {{ msg }}
            </div>
            <span class="hide-overflow">
              {{ msg }}
            </span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        label="Commands"
        align="center"
      >
        <template slot-scope="scope">
          {{ scope.row.payload.reducedPayload.commandsList.length }}
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      :page-size="pageSize"
      :total="allTransactionsSize"
      class="wallet-pagination"
      layout="prev, pager, next"
      @current-change="onNextPage"
    />
  </div>
</template>

<script lang="ts">
import DateFormat from '@/components/mixins/dateFormat'
import numberFormat from '@/components/mixins/numberFormat'
import currencySymbol from '@/components/mixins/currencySymbol'

import { Component, Prop, Mixins } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'

import isObject from 'lodash/isObject'
import { lazyComponent } from '@/router'
import BN from 'bignumber.js'

interface Wallet {
  assetId: string;
}

@Component({
  components: {
    HistoryTableItem: lazyComponent('Wallets/components/HistoryTableItem')
  }
})
export default class HistoryTable extends Mixins(
  DateFormat,
  numberFormat,
  currencySymbol
) {
  @Prop(Object) readonly wallet!: Wallet

  activePage = 1
  pageSize = 10

  @Getter getTransactionsByAssetId
  @Getter getPaginationMetaByAssetId

  get transactions () {
    if (!this.wallet) return []
    const paging = [this.activePage * 10 - 10, this.activePage * 10]
    return this.getTransactionsByAssetId(this.wallet.assetId)
      .slice()
      .sort((t1, t2) => {
        const date1 = t1.payload.reducedPayload.createdTime
        const date2 = t2.payload.reducedPayload.createdTime
        return date2 - date1
      })
      .slice(...paging)
  }

  get paginationMeta () {
    if (!this.wallet.assetId) return {}
    return this.getPaginationMetaByAssetId(this.wallet.assetId)
  }

  get allTransactionsSize () {
    if (!this.paginationMeta) return 1
    return this.paginationMeta.allTransactionsSize
  }

  @Action getAccountAssetTransactionsNextPage

  onNextPage (page) {
    this.activePage = page
    this.getAccountAssetTransactionsNextPage({
      page,
      assetId: this.wallet.assetId
    })
  }

  calcTotalAmount (commands) {
    const total: BN = commands.reduce((p, n) => {
      if (n.transferAsset) {
        const { sign, amount, assetId } = n.transferAsset
        if (this.wallet.assetId !== assetId) return new BN(0)
        if (sign === '+') {
          return p.plus(
            new BN(amount)
          )
        } else {
          return p.minus(
            new BN(amount)
          )
        }
      }
      if (n.addAssetQuantity) {
        const { amount, assetId } = n.addAssetQuantity
        if (this.wallet.assetId !== assetId) return new BN(0)
        return p.plus(
          new BN(amount)
        )
      }
      if (n.subtractAssetQuantity) {
        const { amount, assetId } = n.subtractAssetQuantity
        if (this.wallet.assetId !== assetId) return new BN(0)
        return p.minus(
          new BN(amount)
        )
      }
    }, new BN(0))

    return total.gt(0)
      ? `+${total}`
      : total.lt(0)
        ? total
        : 0
  }

  getFirstDescription (commands) {
    for (const c of commands) {
      if (c.transferAsset) {
        const message = c.transferAsset.message
        switch (c.transferAsset.type) {
          case 'WITHDRAWAL':
            return `Withdraw to Ethereum address: ${message}`
          case 'EXCHANGE':
            const assetFromName = this.wallet.assetId.split('#')[0]
            const assetToName = message.split('#')[0]
            return `Conversion from ${assetFromName.toUpperCase()} to ${assetToName.toUpperCase()}`
          default:
            return message
        }
      }
    }
    return ''
  }

  getType (commands) {
    for (const c of commands) {
      if (c.transferAsset) {
        switch (c.transferAsset.type) {
          case 'WITHDRAWAL':
            return {
              label: 'Withdrawal',
              icon: 'right'
            }
          case 'DEPOSIT':
            return {
              label: 'Deposit',
              icon: 'left'
            }
          case 'SEND':
            return {
              label: 'Transfer',
              icon: 'up'
            }
          case 'RECEIVE':
            return {
              label: 'Transfer',
              icon: 'down'
            }
          case 'EXCHANGE':
            return {
              label: 'Exchange',
              icon: 'down'
            }
          default:
            break
        }
      }
    }
    return {
      label: 'Operation',
      icon: 'others'
    }
  }
}
</script>

<style scoped>
.header_btn-icon {
  transform: scale(1.1);
}
.history-table {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  flex-grow: 2;
  background-color: #ffffff;
  padding: 1.5rem 0 0;
}
.history-table .history-table_header-title {
  display: flex;
  justify-content: space-between;
  padding: 0 1.5rem;
}

.card {
  height: 14rem;
}

.card_header {
  padding: 0.9rem 1.5rem;
}

.card_header-title {
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
}

.card_header-name {
  padding: 1rem 0 0 1rem;
}

.card_history-title {
  font-size: 1.2rem;
}

.wallets_table {
  font-size: 0.8rem;
}
.wallets_table .wallets_table-type {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.wallets_table .wallets_table-type-icon {
  margin-right: 0.4rem;
}
.wallets_table >>> .el-table__header th {
  font-weight: 500;
}
.wallets_table >>> .el-table__row td .cell {
  color: #000000;
}
.wallets_table >>> .el-table__body tr {
  height: 4.5rem;
}
.wallets_table >>> .el-table__expanded-cell {
  padding: 0;
}
/* .wallets_table >>> .el-table__expand-icon {
  display: none;
} */
.wallet-pagination {
  display: flex;
  justify-content: center;
  padding: 0;
}

.wallet-pagination >>> .el-icon {
  line-height: 2rem;
  opacity: 0.5;
}

.wallet-pagination >>> .el-icon:hover {
  color: #000000;
  opacity: 1;
}

.wallet-pagination >>> .number {
  height: 2rem;
  width: 2rem;
  line-height: 2rem;
  opacity: 0.5;
}

.wallet-pagination >>> .number:hover {
  color: #000000;
  opacity: 1;
}

.wallet-pagination >>> .number.active {
  background-color: #f4f4f4;
  color: #000000;
  opacity: 1;
}
</style>
