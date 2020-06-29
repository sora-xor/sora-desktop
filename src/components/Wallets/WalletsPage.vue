<template>
  <el-container v-if="wallets.length">
    <el-aside
      class="column-fullheight wallets-menu"
      width="250px"
    >
      <div class="searchbar">
        <div class="searchbar__prefix">
          <fa-icon
            icon="search"
            class="searchbar__icon"
          />
        </div>

        <div class="searchbar__input">
          <el-input
            v-model="search"
            placeholder="Search"
          />
        </div>

        <div class="searchbar__sort">
          <el-dropdown
            trigger="click"
            @command="sort"
          >
            <div
              id="wallets-sort-button"
              class="searchbar__sort-button"
            >
              <fa-icon
                :icon="defaultIcon.icon"
                class="searchbar__icon"
              />
            </div>

            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                v-for="criterion in criterions"
                :key="criterion.name"
                :command="criterion"
                :disabled="defaultIcon.name === criterion.name"
              >
                <fa-icon :icon="criterion.icon" />
                {{ criterion.name }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>

      <wallet-menu-item
        v-for="wallet in sortedWallets"
        :key="wallet.id"
        :wallet-id="wallet.id"
        :name="wallet.name"
        :asset="wallet.asset"
      />
    </el-aside>
    <el-main class="column-fullheight wallet">
      <router-view :key="$route.params.walletId" />
    </el-main>
  </el-container>
  <el-container v-else>
    <no-assets-card />
  </el-container>
</template>

<script lang="ts">
import { lazyComponent } from '@/router'
import sortBy from 'lodash/fp/sortBy'

import { Vue, Component, Watch } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'

@Component({
  components: {
    WalletMenuItem: lazyComponent('Wallets/WalletMenuItem'),
    NoAssetsCard: lazyComponent('common/NoAssetsCard')
  }
})
export default class WalletsPage extends Vue {
  search = ''
  criterions = [
    { name: 'alphabetical (asc)', icon: 'sort-alpha-up', key: 'name', desc: false },
    { name: 'alphabetical (desc)', icon: 'sort-alpha-down', key: 'name', desc: true },
    { name: 'token amount (asc)', icon: 'sort-amount-up', key: 'amount', desc: false, numeric: true },
    { name: 'token amount (desc)', icon: 'sort-amount-down', key: 'amount', desc: true, numeric: true },
    { name: 'fiat price (asc)', icon: 'sort-numeric-up', key: 'fiat', desc: false, numeric: true },
    { name: 'fiat price (desc)', icon: 'sort-numeric-down', key: 'fiat', desc: true, numeric: true }
  ]

  @Getter wallets
  @Getter('walletsSortCriterion') currentCriterion
  @Getter ethMasterContractAddress
  @Getter hasEthWallet

  get defaultIcon () {
    return this.currentCriterion || this.criterions[0]
  }

  get walletsWithFiatPrice () {
    return this.wallets
  }
  get filteredWallets () {
    const walletsWithEmpty = [...this.walletsWithFiatPrice]
    if (this.ethMasterContractAddress && !this.hasEthWallet) {
      walletsWithEmpty.push({
        id: 'eth-empty',
        name: 'Ether',
        asset: 'ETH'
      })
    }

    return this.search
      ? walletsWithEmpty.filter(x => x.name.toLowerCase().indexOf(this.search.toLowerCase()) > -1 || x.asset.toLowerCase().indexOf(this.search.toLowerCase()) > -1)
      : walletsWithEmpty
  }
  get sortedWallets () {
    const { numeric, key, desc } = this.currentCriterion
    const sorted = sortBy(
      (x: any) => numeric ? parseFloat(x[key]) : x[key]
    )(this.filteredWallets)
    return desc ? sorted.reverse() : sorted
  }

  async created () {
    this.loadWalletsSortCriterion()
    if (!this.currentCriterion) this.sort(this.criterions[0])

    this.getAllAssetsTransactions()
    await this.getAccountAssets()

    if (this.wallets.length) {
      this.$router.push(`/wallets/xor$sora`)
    }
  }

  @Action getAccountAssets
  @Action getAllAssetsTransactions
  @Action loadWalletsSortCriterion
  @Action updateWalletsSortCriterion

  sort (criterion) {
    this.updateWalletsSortCriterion(criterion)
  }
}
</script>

<style scoped>
.wallets-menu {
  background: white;
  border-right: 1px solid #E5E5E5;
}

.searchbar {
  display: flex;
  align-items: center;
  height: 3rem;
  border-bottom: 0.5px solid #E5E5E5;
}

.searchbar__prefix {
  flex: 0 1 auto;
  padding: 0.5rem 1.5rem;
}

.searchbar__input {
  flex: 1 1 auto;
}

.searchbar__sort {
  flex: 0 1 auto;
  padding: 0.5rem 1.5rem;
}

.searchbar__sort-button {
  display: inline-block;
  border: 1px solid #c0c4cc;
  padding: 3px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.searchbar__icon {
  color: #c0c4cc;
}

.searchbar .el-input {
  height: 100%;
}

.searchbar .el-input >>> input {
  height: 100%;
  border: none;
  padding: 0;
}
</style>
