<template>
  <div
    v-if="wallet.assetId"
    class="wallet-page"
  >
    <info-cards
      :wallet="wallet"
      @update-history="updateHistory"
    />
    <history-table
      :wallet="wallet"
      @update-history="updateHistory"
    />
  </div>
  <div v-else>
    <no-assets-card />
  </div>
</template>

<script lang="ts">
import { lazyComponent } from '@/router'

import { Vue, Component } from 'vue-property-decorator'
import { Action, Getter } from 'vuex-class'

@Component({
  components: {
    InfoCards: lazyComponent('Wallets/components/InfoCards'),
    HistoryTable: lazyComponent('Wallets/components/HistoryTable'),
    NoAssetsCard: lazyComponent('common/NoAssetsCard')
  }
})
export default class Wallet extends Vue {
  @Getter wallets

  get wallet () {
    const walletId = this.$route.params.walletId
    return this.wallets
      .find(w => (w.id === walletId)) || {}
  }

  mounted () {
    if (this.wallet.assetId) {
      this.updateHistory()
    }
  }

  @Action getAccountAssets
  @Action getAccountAssetTransactions

  updateHistory () {
    this.getAccountAssets()
    this.getAccountAssetTransactions({ assetId: this.wallet.assetId })
  }
}
</script>

<style scoped>
.wallet-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
