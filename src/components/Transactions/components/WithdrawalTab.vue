<template>
  <el-table
    :data="listOfProofs"
    class="transactions_table"
    fit
  >
    <el-table-column width="48" />
    <el-table-column
      label="Date"
      width="150"
    >
      <template slot-scope="scope">
        {{ formatDate(scope.row.txTime) }}
      </template>
    </el-table-column>
    <el-table-column
      label="Amount"
      prop="amount"
      width="150"
    >
      <template slot-scope="scope">
        {{ scope.row.amount | correctAmount }}
      </template>
    </el-table-column>
    <el-table-column
      label="Destination"
      prop="to"
      show-overflow-tooltip
    />
    <el-table-column />
    <el-table-column>
      <template slot-scope="scope">
        <div class="transaction_action">
          <sora-button
            label="Sign"
            @click="openDialogWith(scope.row)"
          />
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>
<script lang="ts">
import { Vue, Component, Mixins } from 'vue-property-decorator'
import { Getter, Action, State } from 'vuex-class'
import { mixins } from 'vue-class-component'
import DateFormat from '@/components/mixins/dateFormat'
import BigNumber from 'bignumber.js'
import configUtil from '@/util/config-util'
import { lazyComponent } from '@/router'

interface SoraECDSASignature {
  r: string;
  s: string;
  v: string;
}

interface SoraEthWithdrawalProofs {
  accountIdToNotify: string;
  tokenContractAddress: string;
  amount: string;
  relay: string;
  proofs: SoraECDSASignature[];
  irohaTxHash: string;
  to: string;
  id: string;
  txTime: string;
}

interface SoraEthWithdrawalAck {
  irohaTxHash: string;
  id; string;
  txTime: string;
  blockNum: string;
  txIndex: string;
}

@Component({
  components: {
    SoraButton: lazyComponent('UI/SoraButton')
  },
  filters: {
    correctAmount (value) {
      return new BigNumber(value)
        .dividedBy(
          new BigNumber(10).pow(18)
        )
    }
  }
})
export default class WithdrawalTab extends mixins(
  DateFormat
) {
  eventSource
  listOfProofs: SoraEthWithdrawalProofs[] = []

  @Getter accountId
  @Getter servicesIPs

  async created () {
    const sseService = this.servicesIPs['sse-service'].value
    try {
      const proofs: SoraEthWithdrawalProofs[] = await this.getPreviousProofs()
      const sortFunc = (a, b) => new BigNumber(b.txTime).minus(new BigNumber(a.txTime)).toNumber()
      this.listOfProofs = [
        ...proofs.slice().sort(sortFunc)
      ]
    } catch (error) {}
    this.eventSource = new EventSource(
      `${configUtil.getUrlProtocol}//${sseService}/notification/subscribe/withdrawalProofs/${this.accountId}`
    )
    this.eventSource.addEventListener('sora-withdrawal-proofs-event', this.handleProofMessage)
    this.eventSource.addEventListener('sora-withdrawal-ack-event', this.handleAckMessage)
  }

  beforeDestroy () {
    this.eventSource.removeEventListener('sora-withdrawal-proofs-event', this.handleProofMessage)
    this.eventSource.removeEventListener('sora-withdrawal-ack-event', this.handleAckMessage)
    this.eventSource.close()
  }

  @Action getPreviousProofs
  @Action openEthereumApprovalDialog

  handleProofMessage (event) {
    const proof: SoraEthWithdrawalProofs = JSON.parse(event.data)
    this.listOfProofs = [
      proof,
      ...this.listOfProofs
    ]
  }

  handleAckMessage (event) {
    const data: SoraEthWithdrawalAck = JSON.parse(event.data)
    const clearedProofs = this.listOfProofs.slice()
      .filter(f => f.irohaTxHash !== data.irohaTxHash)
    this.listOfProofs = [...clearedProofs]
  }

  async openDialogWith (proof: SoraEthWithdrawalProofs) {
    await this.openEthereumApprovalDialog({ proof })
  }
}
</script>

<style scoped>
.transactions_table {
  font-size: 0.8rem;
}
.transactions_table .transaction_table-signs {
  display: flex;
  align-items: center;
}
.transactions_table .transaction_table-question {
  width: 1rem;
  margin-left: 0.4rem;
  margin-bottom: 0.2rem;
  cursor: pointer;
}
.transactions_table .transactions_table-amount-icon {
  margin-right: 0.5rem;
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
