<template>
  <el-container>
    <el-main>
      <el-row>
        <el-col :span="24">
          <div class="transaction-page">
            <div class="header">
              <span>Waiting transactions</span>
              <sora-button
                label="Sign all"
                :loading="isSigningAll"
                @click="onSignAllPendingTransactions"
              />
            </div>
            <el-tabs type="card">
              <el-tab-pane
                label="Transactions"
                class="container"
              >
                <TransferTab
                  :account-quorum="accountQuorum"
                  @sign="onSignPendingTransaction"
                />
              </el-tab-pane>
              <el-tab-pane
                label="Withdrawal"
                class="container"
              >
                <WithdrawalTab />
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script lang="ts">
import { mapActions, mapGetters } from 'vuex'
import { lazyComponent } from '@/router'

import { Vue, Component, Mixins } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import TransactionMixin from '@/components/mixins/transaction'

@Component({
  components: {
    TransferTab: lazyComponent('Transactions/components/TransferTab'),
    SettingsTab: lazyComponent('Transactions/components/SettingsTab'),
    WithdrawalTab: lazyComponent('Transactions/components/WithdrawalTab'),
    SoraButton: lazyComponent('UI/SoraButton')
  }
})
export default class TransactionPage extends Mixins(
  TransactionMixin
) {
  isSigningAll = false

  @Getter accountQuorum

  created () {
    this.getAllUnsignedTransactions()
  }

  @Action getAllUnsignedTransactions
  @Action createPendingTransaction
  @Action createPendingTransactions

  async onSignPendingTransaction (txStoreId, signatures) {
    const transaction = await this.createPendingTransaction({
      txStoreId
    })
    this.$sendTransaction(
      transaction,
      () => this.accountQuorum > signatures.length + 1
        ? this.$message.warning('Cool! Waiting for other signatures.')
        : this.$message.success('Transaction successuflly send!')
    )
      .then(async () => this.getAllUnsignedTransactions())
      .catch(err => {
        console.error('Error:', err)
      })
  }

  async onSignAllPendingTransactions () {
    this.isSigningAll = true
    try {
      const txs = await this.createPendingTransactions()
      if (!txs.length) return (this.isSigningAll = false)
      for (const tx of txs) {
        await this.$sendTransaction(tx, () => {})
      }
      await this.getAllUnsignedTransactions()
    } catch (error) {
      console.error(error)
      this.$message.error('Error! Try to sign transactions again')
    }
    this.isSigningAll = false
  }
}
</script>

<style scoped>
.transaction-page {
  min-height: 100vh;
  background-color: white;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem;
}
</style>
