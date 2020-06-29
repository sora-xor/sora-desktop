<template>
  <el-table
    :data="formattedTransactions"
    class="transactions_table"
  >
    <el-table-column
      type="expand"
    >
      <template slot-scope="scope">
        <table-row
          :commands="scope.row.payload.reducedPayload.commandsList"
        />
      </template>
    </el-table-column>
    <el-table-column
      width="130"
      align="center"
    >
      <template slot-scope="scope">
        <div
          class="transactions_table-type"
          :set="type = getType(scope.row.payload.reducedPayload.commandsList)"
        >
          <img
            v-if="!type.icon.includes('svg')"
            :class="[
              'transactions_table-type-icon',
              `blue_arrow ${type.icon}`
            ]"
            src="@/assets/wallet/blue-arrow.svg"
          >
          <img
            v-else
            class="transactions_table-type-icon"
            :src="require(`@/assets/wallet/${type.icon}`)"
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
          {{ amount === 0 ? '-' : amount }}
        </div>
      </template>
    </el-table-column>
    <el-table-column
      label="Description"
      header-align="center"
      show-overflow-tooltip
    >
      <template slot-scope="scope">
        {{ getFirstDescription(scope.row.payload.reducedPayload.commandsList) }}
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
    <el-table-column
      label="Expire in"
      align="center"
    >
      <template slot-scope="scope">
        {{ calculateEstimatedTime(scope.row.payload.reducedPayload.createdTime) }}
      </template>
    </el-table-column>
    <el-table-column
      label="Signed"
      align="center"
    >
      <template slot-scope="scope">
        <div class="transaction_table-signs">
          <span class="transaction_table-text">
            {{
              scope.row.signaturesList.length > accountQuorum
                ? scope.row.signaturesList.length / 2
                : scope.row.signaturesList.length
            }}
            /
            {{ accountQuorum }}
          </span>
          <el-tooltip
            class="item"
            effect="dark"
            :set="keys = getPublicKeys(scope.row.signaturesList)"
          >
            <div slot="content">
              <p>Signed by:</p>
              <p
                v-for="k of keys.signed"
                :key="k"
              >
                {{ k }}
              </p>
              <br>
              <p>Waiting for:</p>
              <p
                v-for="k of keys.others"
                :key="k"
              >
                {{ k }}
              </p>
            </div>
            <img
              src="@/assets/icons/question.svg"
              class="transaction_table-question"
            >
          </el-tooltip>
        </div>
      </template>
    </el-table-column>
    <el-table-column
      align="center"
    >
      <template slot-scope="scope">
        <div
          v-if="scope.row.signaturesList.length < accountQuorum"
          class="transaction_action"
        >
          <sora-button
            v-if="getPublicKeys(scope.row.signaturesList).signed.includes(accountPublicKey)"
            label="Signed"
            class="clear_padding"
            :disabled="true"
            type="secondary"
          />
          <sora-button
            v-else
            label="Sign"
            class="clear_padding"
            @click="addSignatory(scope.row.id, scope.row.signaturesList)"
          />
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts">
import without from 'lodash/without'
import { mapGetters } from 'vuex'
import DateFormat from '@/components/mixins/dateFormat'
import MessageMixin from '@/components/mixins/message'

import { Vue, Component, Mixins, Prop } from 'vue-property-decorator'
import { Getter, State } from 'vuex-class'
import { lazyComponent } from '@/router'
import BN from 'bignumber.js'

@Component({
  components: {
    SoraButton: lazyComponent('UI/SoraButton'),
    TableRow: lazyComponent('Transactions/components/TableRow')
  }
})
export default class TransferTab extends Mixins(
  DateFormat,
  MessageMixin
) {
  @Prop(Number) readonly accountQuorum!: number

  liveTimeOfTransaction = 24 * 60 * 60 * 1000 // 24h in milliseconds
  time = new Date().getTime()
  updateTimer: number | undefined

  @Getter pendingTransactions
  @Getter accountSignatories

  @State(state => state.Account.accountPublicKey) accountPublicKey

  mounted () {
    this.updateTimer = window.setInterval(() => {
      this.time = new Date().getTime()
    }, 1 * 1000)
  }

  beforeDestroy () {
    window.clearInterval(this.updateTimer)
  }

  get formattedTransactions () {
    return this.pendingTransactions
      .sort((t1, t2) => {
        const date1 = t1.payload.reducedPayload.createdTime
        const date2 = t2.payload.reducedPayload.createdTime
        return date2 - date1
      })
  }

  calculateEstimatedTime (date) {
    const rightDate = date + this.liveTimeOfTransaction
    return this.compareDates(rightDate, this.time)
  }

  addSignatory (id, signatures) {
    this.$emit('sign', id, signatures)
  }

  calcTotalAmount (commands) {
    const total = commands.reduce((p, n) => {
      if (n.transferAsset) {
        const { sign, amount } = n.transferAsset
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
        return p.plus(
          new BN(n.addAssetQuantity.amount)
        )
      }
      if (n.subtractAssetQuantity) {
        return p.minus(
          new BN(n.subtractAssetQuantity.amount)
        )
      }
      return p
    }, new BN(0))

    return total
      ? total.gt(0)
        ? `+${total}`
        : total.lt(0)
          ? total
          : 0
      : 0
  }

  getFirstDescription (commands) {
    for (const c of commands) {
      if (c.transferAsset) {
        return c.transferAsset.type === 'WITHDRAWAL'
          ? `Withdraw to Ethereum address: ${c.transferAsset.message}`
          : c.transferAsset.message
      }
      if (c.addSignatory) {
        return 'Adding signatory'
      }
      if (c.removeSignatory) {
        return 'Removing signatory'
      }
    }
    return ''
  }

  getPublicKeys (signatures) {
    const signed = signatures.map(({ publicKey }) => publicKey.toUpperCase())
    return {
      signed,
      others: without(this.accountSignatories, ...signed)
    }
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
          default:
            break
        }
      }
    }
    return {
      label: 'Operation',
      icon: 'others.svg'
    }
  }
}
</script>

<style scoped>
.transactions_table {
  font-size: 0.8rem;
}
.transactions_table .transactions_table-type {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.transactions_table .transactions_table-type-icon {
  margin-right: 0.4rem;
}
.transactions_table .transaction_table-signs {
  display: flex;
  align-items: center;
  justify-content: center;
}
.transactions_table .transaction_table-question {
  width: 1rem;
  margin-left: 0.4rem;
  margin-bottom: 0.2rem;
  cursor: pointer;
}
.transactions_table >>> .el-table__header th {
  font-weight: 500;
}
.transactions_table >>> .el-table__row td .cell {
  color: #000000;
}
.transactions_table >>> .el-table__body tr {
  height: 4.5rem;
}
.transactions_table >>> .el-table__expanded-cell {
  padding: 0;
}
</style>
